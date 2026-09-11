"""Members router — /api/members"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.database.Mongodb import get_database
from app.models.member import MemberCreate, MemberUpdate
from app.schemas.book_schema import member_entity, member_list_entity
from app.utils.id_generator import generate_member_id

router = APIRouter()


@router.get("/")
def list_members(
    search: str = Query("", description="Search by name, email, or phone"),
    status: str = Query("", description="Filter by status (Active / Inactive)"),
):
    db = get_database()
    query: dict = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    if status:
        query["status"] = status
    members = db["members"].find(query).sort("name", 1)
    return member_list_entity(members)


@router.get("/{member_id}")
def get_member(member_id: str):
    db = get_database()
    member = db["members"].find_one({"member_id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    return member_entity(member)


@router.post("/", status_code=201)
def create_member(data: MemberCreate):
    db = get_database()
    # Prevent duplicate emails
    if db["members"].find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="A member with this email already exists")
    member_id = generate_member_id(db)
    doc = {
        "member_id": member_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "address": data.address or "",
        "status": "Active",
        "joined_date": datetime.utcnow().date().isoformat(),
    }
    result = db["members"].insert_one(doc)
    new_member = db["members"].find_one({"_id": result.inserted_id})
    return member_entity(new_member)


@router.put("/{member_id}")
def update_member(member_id: str, data: MemberUpdate):
    db = get_database()
    if not db["members"].find_one({"member_id": member_id}):
        raise HTTPException(status_code=404, detail="Member not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    db["members"].update_one({"member_id": member_id}, {"$set": update_data})
    updated = db["members"].find_one({"member_id": member_id})
    return member_entity(updated)


@router.delete("/{member_id}")
def delete_member(member_id: str):
    db = get_database()
    member = db["members"].find_one({"member_id": member_id})
    if not member:
        raise HTTPException(status_code=404, detail="Member not found")
    # Block deletion if member has active issues
    active = db["issues"].count_documents({"member_id": member_id, "status": "Issued"})
    if active > 0:
        raise HTTPException(
            status_code=400,
            detail="Cannot delete member — they have books currently issued"
        )
    db["members"].delete_one({"member_id": member_id})
    return {"message": f"Member {member_id} deleted successfully"}
