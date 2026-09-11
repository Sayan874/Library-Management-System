"""
backfill_thumbnails.py
──────────────────────
One-time script: searches Google Books by ISBN (or title+author) for every
book in the database that is missing a thumbnail, then updates the record.

Run from the Backend directory:
    python scripts/backfill_thumbnails.py
"""

import sys
import os

# Make sure app package is importable when running from Backend/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.Mongodb import connect_to_mongo, get_database
from app.services.google_books_service import search_google_books
from app.config.settings import GOOGLE_BOOKS_API_KEY


def secure_url(url: str) -> str:
    if url and url.startswith("http://"):
        return "https://" + url[7:]
    return url or ""


def fetch_thumbnail(isbn: str, title: str, author: str) -> str:
    """Try ISBN first, fall back to title search."""
    if isbn:
        results = search_google_books(isbn, api_key=GOOGLE_BOOKS_API_KEY, max_results=1)
        if results and results[0].get("thumbnail"):
            return secure_url(results[0]["thumbnail"])

    # Fallback: title + author
    query = f"{title} {author}".strip()
    if query:
        results = search_google_books(query, api_key=GOOGLE_BOOKS_API_KEY, max_results=1)
        if results and results[0].get("thumbnail"):
            return secure_url(results[0]["thumbnail"])

    return ""


def main():
    connect_to_mongo()
    db = get_database()

    # Find all books that have no thumbnail or an empty one
    books = list(db["books"].find(
        {"$or": [{"thumbnail": {"$exists": False}}, {"thumbnail": ""}]},
        {"book_id": 1, "isbn": 1, "title": 1, "author": 1, "_id": 1}
    ))

    print(f"Found {len(books)} books without a thumbnail.\n")
    updated = 0

    for book in books:
        isbn   = book.get("isbn", "")
        title  = book.get("title", "")
        author = book.get("author", "")
        book_id = book.get("book_id", str(book["_id"]))

        thumb = fetch_thumbnail(isbn, title, author)
        if thumb:
            db["books"].update_one(
                {"_id": book["_id"]},
                {"$set": {"thumbnail": thumb}}
            )
            print(f"  ✓ {book_id:15s} {title[:40]:40s} → {thumb[:60]}")
            updated += 1
        else:
            print(f"  ✗ {book_id:15s} {title[:40]:40s} — no thumbnail found")

    print(f"\nDone. Updated {updated}/{len(books)} books.")


if __name__ == "__main__":
    main()
