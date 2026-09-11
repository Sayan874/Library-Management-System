"""
Serializers — convert raw MongoDB documents (which have BSON ObjectId)
into plain Python dicts that FastAPI can return as JSON.
"""


def _secure_url(url: str) -> str:
    """Upgrade http:// image URLs to https:// to prevent browser mixed-content blocking."""
    if url and url.startswith("http://"):
        return "https://" + url[7:]
    return url or ""


def book_entity(book: dict) -> dict:
    return {
        "id": str(book["_id"]),
        "book_id": book.get("book_id", ""),
        "title": book.get("title", ""),
        "author": book.get("author", ""),
        "isbn": book.get("isbn", ""),
        "genre": book.get("genre", ""),
        "publisher": book.get("publisher", ""),
        "year": book.get("year"),
        "status": book.get("status", "Available"),
        "cover_image": _secure_url(book.get("thumbnail", "")),
        "description": book.get("description", ""),
    }


def book_list_entity(books) -> list:
    return [book_entity(b) for b in books]


# ── Member serializers ────────────────────────────────────────────────────────

def member_entity(member: dict) -> dict:
    return {
        "id": str(member["_id"]),
        "member_id": member.get("member_id", ""),
        "name": member.get("name", ""),
        "email": member.get("email", ""),
        "phone": member.get("phone", ""),
        "address": member.get("address", ""),
        "status": member.get("status", "Active"),
        "joined_date": member.get("joined_date", ""),
    }


def member_list_entity(members) -> list:
    return [member_entity(m) for m in members]


# ── Issue serializers ─────────────────────────────────────────────────────────

def issue_entity(issue: dict) -> dict:
    return {
        "id": str(issue["_id"]),
        "issue_id": issue.get("issue_id", ""),
        "book_id": issue.get("book_id", ""),
        "book_name": issue.get("book_name", ""),
        "member_id": issue.get("member_id", ""),
        "issuer_id": issue.get("issuer_id", ""),
        "issue_date": issue.get("issue_date", ""),
        "due_date": issue.get("due_date", ""),
        "return_date": issue.get("return_date"),
        "status": issue.get("status", "Issued"),
        "fine": issue.get("fine", 0.0),
    }


def issue_list_entity(issues) -> list:
    return [issue_entity(i) for i in issues]


# ── Staff serializers ─────────────────────────────────────────────────────────

def staff_entity(staff: dict) -> dict:
    return {
        "id": str(staff["_id"]),
        "staff_id": staff.get("staff_id", ""),
        "name": staff.get("name", ""),
        "email": staff.get("email", ""),
        "phone": staff.get("phone", ""),
        "role": staff.get("role", "Librarian"),
        "status": staff.get("status", "Active"),
        "joined_date": staff.get("joined_date", ""),
    }


def staff_list_entity(staff_list) -> list:
    return [staff_entity(s) for s in staff_list]