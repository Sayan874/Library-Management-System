from pydantic import BaseModel
from typing import Optional


class IssueCreate(BaseModel):
    book_id: str
    member_id: str
    issuer_id: str
    issue_date: Optional[str] = None
    due_date: Optional[str] = None  # backend auto-calculates this; field kept for compatibility
