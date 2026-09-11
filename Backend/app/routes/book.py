from fastapi import APIRouter, Query
from app.controllers.book_controller import search_books_controller

router = APIRouter()


@router.get("/search")
def search_books(query: str = Query(..., min_length=1)):
    return search_books_controller(query)