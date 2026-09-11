from pydantic import BaseModel
from typing import Optional

class BookCreate(BaseModel):
    title: str
    author: str
    isbn: str
    thumbnail: Optional[str] = ""
    genre: Optional[str] = ""
    publisher: Optional[str] = ""
    year: Optional[int] = None
    description: Optional[str] = ""
    copies: Optional[int] = 1  # how many physical copies to create


class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    isbn: Optional[str] = None
    thumbnail: Optional[str] = None
    genre: Optional[str] = None
    publisher: Optional[str] = None
    year: Optional[int] = None
    description: Optional[str] = None
    status: Optional[str] = None
