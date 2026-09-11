"""Books router — /api/books"""

from fastapi import APIRouter, Query

from app.controllers.book_controller import (
    get_all_books,
    get_book_by_id,
    create_book,
    update_book,
    delete_book,
    search_books_online,
    autofill_by_isbn,
)
from app.models.book import BookCreate, BookUpdate

router = APIRouter()


@router.get("/")
def list_books(
    search: str = Query("", description="Search by title, author, or ISBN"),
    genre: str = Query("", description="Filter by genre"),
    status: str = Query("", description="Filter by status (Available / Unavailable)"),
):
    return get_all_books(search=search, genre=genre, status=status)


@router.get("/search")
def google_search(query: str = Query(..., description="Search query for Google Books")):
    """Search Google Books API to auto-fill book details."""
    return search_books_online(query)


@router.get("/isbn-autofill")
def isbn_autofill(isbn: str = Query(..., description="ISBN to look up on Google Books")):
    """Return metadata for a single book by ISBN."""
    return autofill_by_isbn(isbn)


@router.get("/{book_id}")
def get_book(book_id: str):
    return get_book_by_id(book_id)


@router.post("/", status_code=201)
def add_book(data: BookCreate):
    return create_book(data)


@router.put("/{book_id}")
def edit_book(book_id: str, data: BookUpdate):
    return update_book(book_id, data)


@router.delete("/{book_id}")
def remove_book(book_id: str):
    return delete_book(book_id)
