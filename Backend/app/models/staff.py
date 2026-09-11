from pydantic import BaseModel
from typing import Optional

class StaffCreate(BaseModel):
    name: str
    email: str
    phone: str
    role: str = "Librarian"  # "Admin" or "Librarian"
    status: str = "Active"

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
