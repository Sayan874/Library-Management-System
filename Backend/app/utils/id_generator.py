"""
Auto-increment ID generators for all collections.

Book   → LIB-BK-0001
Member → LIB-MB-0001
Staff  → LIB-ST-0001
Issue  → LIB-IS-0001
"""


def _next_id(db, collection: str, field: str, prefix: str) -> str:
    """Find the highest existing ID in *collection* and return the next one."""
    last = (
        db[collection]
        .find({field: {"$regex": f"^{prefix}"}}, {field: 1})
        .sort(field, -1)
        .limit(1)
    )
    last_list = list(last)
    if not last_list:
        return f"{prefix}0001"
    last_id: str = last_list[0][field]
    try:
        num = int(last_id.replace(prefix, ""))
    except ValueError:
        num = 0
    return f"{prefix}{num + 1:04d}"


def generate_book_id(db) -> str:
    return _next_id(db, "books", "book_id", "LIB-BK-")


def generate_member_id(db) -> str:
    return _next_id(db, "members", "member_id", "LIB-MB-")


def generate_staff_id(db) -> str:
    return _next_id(db, "staff", "staff_id", "LIB-ST-")


def generate_issue_id(db) -> str:
    return _next_id(db, "issues", "issue_id", "I-")
