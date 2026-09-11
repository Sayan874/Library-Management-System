"""
Google Books API service.
Fetches book metadata to auto-fill the Add-Book form.
"""

import requests

GOOGLE_BOOKS_API_URL = "https://www.googleapis.com/books/v1/volumes"


import re

def _detect_search_type(query: str):
    clean_query = query.strip()
    lower_q = clean_query.lower()
    if lower_q.startswith("isbn:"):
        # Explicit ISBN query
        return "isbn", clean_query[5:].strip()
    if lower_q.startswith("author:") or lower_q.startswith("inauthor:"):
        return "author", clean_query.split(":", 1)[1].strip()
    if lower_q.startswith("title:") or lower_q.startswith("intitle:"):
        return "title", clean_query.split(":", 1)[1].strip()
        
    stripped = re.sub(r'[\s\-]', '', clean_query)
    if (len(stripped) == 10 or len(stripped) == 13) and stripped.isalnum():
        if re.match(r'^\d{9}[\dX]$', stripped, re.IGNORECASE) or re.match(r'^\d{13}$', stripped):
            return "isbn", stripped
            
    return "title", clean_query

def _extract_isbns(identifiers: list):
    isbn10, isbn13 = "", ""
    for id_obj in identifiers:
        val = id_obj.get("identifier", "")
        clean_val = re.sub(r'[\s\-]', '', val)
        if id_obj.get("type") == "ISBN_10":
            isbn10 = clean_val
        elif id_obj.get("type") == "ISBN_13":
            isbn13 = clean_val
    return isbn10, isbn13

def search_google_books(query: str, api_key: str = "", max_results: int = 10) -> list:
    search_type, search_value = _detect_search_type(query)
    
    if search_type == "isbn":
        search_value = re.sub(r'[\s\-]', '', search_value)
        q_param = f"isbn:{search_value}"
    elif search_type == "author":
        q_param = f"inauthor:{search_value}"
    else:
        q_param = search_value

    params: dict = {"q": q_param, "maxResults": min(max_results, 40)}
    if api_key:
        params["key"] = api_key

    try:
        response = requests.get(GOOGLE_BOOKS_API_URL, params=params, timeout=8)
        response.raise_for_status()
        data = response.json()
    except requests.RequestException as e:
        # Mock book structure returning exact fields
        return [{
            "title": f"Mock Book (Query: {query})",
            "authors": ["API Rate Limited"],
            "isbn10": "",
            "isbn13": search_value if search_type == 'isbn' else "9780000000000",
            "publisher": "Backend System",
            "thumbnail": "https://via.placeholder.com/128x192.png?text=Rate+Limited",
            "description": "Google API blocked the request (either 429 Rate Limit or 403 Forbidden). Please configure GOOGLE_BOOKS_API_KEY.",
            "pageCount": 0
        }]

    results = []
    for item in data.get("items", []):
        info = item.get("volumeInfo", {})
        identifiers = info.get("industryIdentifiers", [])
        isbn10, isbn13 = _extract_isbns(identifiers)
        
        if search_type == "isbn":
            # Only return books where the searched ISBN matches one of the identifiers
            if search_value.upper() not in (isbn10.upper(), isbn13.upper()):
                continue

        raw_thumb = info.get("imageLinks", {}).get("thumbnail", "")
        # Google returns http:// thumbnails — upgrade to https:// so browsers don't block them
        if raw_thumb.startswith("http://"):
            raw_thumb = "https://" + raw_thumb[7:]

        results.append({
            "title": info.get("title", ""),
            "authors": info.get("authors", []),
            "isbn10": isbn10,
            "isbn13": isbn13,
            "publisher": info.get("publisher", ""),
            "thumbnail": raw_thumb,
            "description": info.get("description", ""),
            "pageCount": info.get("pageCount", 0)
        })

    return results

def get_book_by_isbn(isbn: str, api_key: str = "") -> dict | None:
    """
    Fetch a single book's details from Google Books using its ISBN.
    Returns a metadata dict, or None if not found.
    """
    results = search_google_books(f"isbn:{isbn}", api_key=api_key, max_results=1)
    return results[0] if results else None