"""
Book controller — business logic for /api/books.

Per-copy architecture: every physical copy of a book is stored as its own
document with a unique `book_id` (e.g. LIB-BK-0001).
When a BookCreate request arrives with copies > 1, multiple documents are
inserted — one per physical copy.
"""

from fastapi import HTTPException

from app.database.Mongodb import get_database
from app.models.book import BookCreate, BookUpdate
from app.schemas.book_schema import book_entity, book_list_entity
from app.utils.id_generator import generate_book_id
from app.services.google_books_service import search_google_books, get_book_by_isbn
from app.config.settings import GOOGLE_BOOKS_API_KEY


# ── Read ──────────────────────────────────────────────────────────────────────

def get_all_books(search: str = "", genre: str = "", status: str = "") -> list:
    db = get_database()
    query: dict = {}

    if search:
        query["$or"] = [
            {"title":  {"$regex": search, "$options": "i"}},
            {"author": {"$regex": search, "$options": "i"}},
            {"isbn":   {"$regex": search, "$options": "i"}},
        ]
    if genre:
        query["genre"] = {"$regex": genre, "$options": "i"}
    if status:
        query["status"] = status

    books = list(db["books"].find(query).sort("title", 1))
    return book_list_entity(books)


def get_book_by_id(book_id: str) -> dict:
    db = get_database()
    book = db["books"].find_one({"book_id": book_id})
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    return book_entity(book)


# ── Create ────────────────────────────────────────────────────────────────────

def create_book(data: BookCreate) -> list | dict:
    """
    Insert one document per physical copy.
    Returns a list of created copy records.
    """
    db = get_database()
    copies = max(1, data.copies or 1)

    created = []
    for _ in range(copies):
        book_id = generate_book_id(db)
        doc = {
            "book_id":     book_id,
            "title":       data.title,
            "author":      data.author,
            "isbn":        data.isbn,
            "thumbnail":   data.thumbnail or "",
            "genre":       data.genre or "",
            "publisher":   data.publisher or "",
            "year":        data.year,
            "description": data.description or "",
            "status":      "Available",
        }
        result = db["books"].insert_one(doc)
        new_book = db["books"].find_one({"_id": result.inserted_id})
        created.append(book_entity(new_book))

    # Return a single object if only one copy was added, list otherwise
    return created[0] if copies == 1 else created


# ── Update ────────────────────────────────────────────────────────────────────

def update_book(book_id: str, data: BookUpdate) -> dict:
    db = get_database()

    existing = db["books"].find_one({"book_id": book_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    updates = {k: v for k, v in data.model_dump().items() if v is not None}
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")

    db["books"].update_one({"book_id": book_id}, {"$set": updates})
    updated = db["books"].find_one({"book_id": book_id})
    return book_entity(updated)


# ── Delete ────────────────────────────────────────────────────────────────────

def delete_book(book_id: str) -> dict:
    db = get_database()

    existing = db["books"].find_one({"book_id": book_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Book not found")

    # Prevent deletion if copy is currently issued
    if existing.get("status") == "Issued":
        raise HTTPException(
            status_code=400,
            detail="Cannot delete a copy that is currently issued"
        )

    db["books"].delete_one({"book_id": book_id})
    return {"message": f"Book copy {book_id} deleted successfully"}


# ── Google Books Integration ──────────────────────────────────────────────────

def search_books_online(query: str) -> list:
    """Search Google Books API and return matching results."""
    results = search_google_books(query, api_key=GOOGLE_BOOKS_API_KEY)
    return results


def autofill_by_isbn(isbn: str) -> dict:
    """Return metadata for a single book by ISBN (for auto-fill in the UI)."""
    book = get_book_by_isbn(isbn, api_key=GOOGLE_BOOKS_API_KEY)
    if not book:
        raise HTTPException(
            status_code=404,
            detail=f"No book found for ISBN: {isbn}"
        )
    return book
