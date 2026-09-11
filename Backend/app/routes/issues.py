"""Issues router — /api/issues  (issue & return books)

Per-copy architecture: each book document IS a physical copy with its own
LIB-BK-XXXX ID and a status field (Available / Issued).
Issuing sets copy status to "Issued"; returning sets it back to "Available".
"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.database.Mongodb import get_database
from app.models.issue import IssueCreate
from app.schemas.book_schema import issue_entity, issue_list_entity
from app.utils.id_generator import generate_issue_id
from app.utils.helper import calculate_fine
from app.config.settings import FINE_PER_DAY

router = APIRouter()


@router.get("/")
def list_issues(
    status: str = Query("", description="Filter by status: Issued / Returned / Overdue"),
    member_id: str = Query("", description="Filter by member ID"),
    book_id: str = Query("", description="Filter by book ID"),
):
    db = get_database()
    query: dict = {}
    if status:
        query["status"] = status
    if member_id:
        query["member_id"] = member_id
    if book_id:
        query["book_id"] = book_id
    issues_cursor = db["issues"].find(query).sort("issue_date", -1)
    issues = list(issues_cursor)
    for issue in issues:
        book = db["books"].find_one({"book_id": issue.get("book_id")})
        issue["book_name"] = book.get("title", "") if book else "Unknown"
    return issue_list_entity(issues)


@router.get("/{issue_id}")
def get_issue(issue_id: str):
    db = get_database()
    issue = db["issues"].find_one({"issue_id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    return issue_entity(issue)


@router.post("/", status_code=201)
def issue_book(data: IssueCreate):
    """Issue a specific physical copy (identified by book_id) to a member."""
    db = get_database()

    # Validate book copy exists and is available
    book = db["books"].find_one({"book_id": data.book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book copy not found")
    if book.get("status") != "Available":
        raise HTTPException(status_code=400, detail="This copy is not available (already issued or reserved)")

    # Validate member
    member = db["members"].find_one({"member_id": data.member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    if member.get("status") == "Inactive":
        raise HTTPException(status_code=400, detail="Inactive members cannot borrow books")

    # Limit to at most 2 books per member
    active_issues_count = db["issues"].count_documents(
        {"member_id": data.member_id, "return_date": None}
    )
    if active_issues_count >= 2:
        raise HTTPException(status_code=400, detail="Member has already reached the maximum limit of 2 borrowed books")

    # Validate staff
    staff = db["staff"].find_one({"staff_id": data.issuer_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Issuer (Staff) not found")
    if staff.get("status") == "Inactive":
        raise HTTPException(status_code=400, detail="Inactive staff cannot issue books")

    # Prevent issuing the same physical copy twice
    already_issued = db["issues"].find_one(
        {"book_id": data.book_id, "status": "Issued"}
    )
    if already_issued:
        raise HTTPException(
            status_code=400,
            detail="This copy is already issued"
        )

    # Determine issue date
    import calendar
    if data.issue_date:
        try:
            issue_dt = datetime.fromisoformat(data.issue_date).date()
        except ValueError:
            issue_dt = datetime.utcnow().date()
    else:
        issue_dt = datetime.utcnow().date()

    # Exact calendar-month logic for Due Date
    month = issue_dt.month
    year = issue_dt.year
    if month == 12:
        month = 1
        year += 1
    else:
        month += 1
    
    _, last_day = calendar.monthrange(year, month)
    day = min(issue_dt.day, last_day)
    due_dt = issue_dt.replace(year=year, month=month, day=day)

    issue_id = generate_issue_id(db)
    doc = {
        "issue_id": issue_id,
        "book_id": data.book_id,
        "member_id": data.member_id,
        "issuer_id": data.issuer_id,
        "issue_date": issue_dt.isoformat(),
        "due_date": due_dt.isoformat(),
        "return_date": None,
        "status": "Issued",
        "fine": 0.0,
    }
    result = db["issues"].insert_one(doc)

    # Mark this physical copy as Issued
    db["books"].update_one(
        {"book_id": data.book_id},
        {"$set": {"status": "Issued"}},
    )

    new_issue = db["issues"].find_one({"_id": result.inserted_id})
    return issue_entity(new_issue)


@router.post("/{issue_id}/return")
def return_book(issue_id: str):
    """Return a book and calculate any overdue fine."""
    db = get_database()

    issue = db["issues"].find_one({"issue_id": issue_id})
    if not issue:
        raise HTTPException(status_code=404, detail="Issue record not found")
    if issue["status"] == "Returned":
        raise HTTPException(status_code=400, detail="Book has already been returned")

    fine = calculate_fine(issue["due_date"], fine_per_day=FINE_PER_DAY)
    return_date = datetime.utcnow().date().isoformat()

    db["issues"].update_one(
        {"issue_id": issue_id},
        {"$set": {"status": "Returned", "return_date": return_date, "fine": fine}},
    )

    # Mark this physical copy as Available again
    db["books"].update_one(
        {"book_id": issue["book_id"]},
        {"$set": {"status": "Available"}},
    )

    updated_issue = db["issues"].find_one({"issue_id": issue_id})
    return {
        **issue_entity(updated_issue),
        "fine_message": f"Fine of ₹{fine} applied." if fine > 0 else "Returned on time. No fine.",
    }
