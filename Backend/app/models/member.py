from pydantic import BaseModel
from typing import Optional


class MemberCreate(BaseModel):
    name: str
    email: str
    phone: str
    address: Optional[str] = None


class MemberUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    status: Optional[str] = None
