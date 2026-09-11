"""
Data migration: Expand title-level book documents into per-copy documents.

For each book doc with total_copies > 1:
  1. Create N individual copy documents with unique LIB-BK-XXXX IDs
  2. Reassign active issue records to specific new copy IDs
  3. Delete the old title-level document

For books with total_copies == 1:
  - Keep as-is but remove total_copies / available_copies fields

Run from Backend dir:  python scripts/migrate_books.py
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME = os.getenv("DB_NAME", "library_db")

client = MongoClient(MONGO_URI)
db = client[DB_NAME]

books_col = db["books"]
issues_col = db["issues"]


def get_next_book_num():
    """Find the highest existing LIB-BK-NNNN number in the DB."""
    import re
    pattern = re.compile(r"^LIB-BK-(\d+)$")
    max_num = 0
    for doc in books_col.find({"book_id": {"$regex": r"^LIB-BK-\d+$"}}, {"book_id": 1}):
        m = pattern.match(doc["book_id"])
        if m:
            max_num = max(max_num, int(m.group(1)))
    return max_num


def migrate():
    all_books = list(books_col.find({}))
    print(f"Found {len(all_books)} book documents to process.\n")

    next_num = get_next_book_num()
    total_copies_created = 0
    total_issues_reassigned = 0

    for book in all_books:
        old_id = book.get("book_id", "?")
        title = book.get("title", "Unknown")
        total_c = book.get("total_copies", 1)
        avail_c = book.get("available_copies", total_c)

        # Find active issues referencing this old book_id
        active_issues = list(issues_col.find({
            "book_id": old_id,
            "status": "Issued",
        }))
        issued_count = len(active_issues)

        print(f"── {old_id}: \"{title}\"  total_copies={total_c}  issued={issued_count}")

        if total_c <= 1 and issued_count == 0:
            # Single-copy book, no active issues: just clean up fields
            status = "Available"
            books_col.update_one(
                {"_id": book["_id"]},
                {"$unset": {"total_copies": "", "available_copies": ""},
                 "$set": {"status": status}}
            )
            print(f"   → Kept {old_id} as single copy (status={status})")
            continue

        if total_c <= 1 and issued_count > 0:
            # Single copy that is issued
            books_col.update_one(
                {"_id": book["_id"]},
                {"$unset": {"total_copies": "", "available_copies": ""},
                 "$set": {"status": "Issued"}}
            )
            print(f"   → Kept {old_id} as single copy (status=Issued)")
            continue

        # Multi-copy book: expand into individual copy documents
        # First, create the base template from the old doc
        template = {
            "title": book.get("title", ""),
            "author": book.get("author", ""),
            "isbn": book.get("isbn", ""),
            "thumbnail": book.get("thumbnail", ""),
            "genre": book.get("genre", ""),
            "publisher": book.get("publisher", ""),
            "year": book.get("year", None),
            "description": book.get("description", ""),
        }

        new_copy_ids = []
        for i in range(total_c):
            next_num += 1
            new_id = f"LIB-BK-{str(next_num).zfill(4)}"
            doc = {
                **template,
                "book_id": new_id,
                "status": "Available",  # default; will be set to Issued below if needed
            }
            books_col.insert_one(doc)
            new_copy_ids.append(new_id)
            total_copies_created += 1

        print(f"   → Created {total_c} copies: {new_copy_ids[0]} ... {new_copy_ids[-1]}")

        # Reassign active issues to the first N new copy IDs
        for idx, issue in enumerate(active_issues):
            if idx < len(new_copy_ids):
                assigned_copy = new_copy_ids[idx]
                issues_col.update_one(
                    {"_id": issue["_id"]},
                    {"$set": {"book_id": assigned_copy}}
                )
                # Mark that copy as Issued
                books_col.update_one(
                    {"book_id": assigned_copy},
                    {"$set": {"status": "Issued"}}
                )
                total_issues_reassigned += 1
                print(f"   → Reassigned {issue.get('issue_id', '?')} → {assigned_copy} (Issued)")

        # Also reassign returned issues to remaining copies (spread them out)
        returned_issues = list(issues_col.find({
            "book_id": old_id,
            "status": "Returned",
        }))
        for idx, issue in enumerate(returned_issues):
            # Assign to copies round-robin (all copies are valid targets for history)
            assigned_copy = new_copy_ids[idx % len(new_copy_ids)]
            issues_col.update_one(
                {"_id": issue["_id"]},
                {"$set": {"book_id": assigned_copy}}
            )
            total_issues_reassigned += 1

        if returned_issues:
            print(f"   → Reassigned {len(returned_issues)} returned issues across copies")

        # Delete the old title-level document
        books_col.delete_one({"_id": book["_id"]})
        print(f"   → Deleted old doc {old_id}")

    # Create unique index on book_id
    books_col.create_index("book_id", unique=True)
    print(f"\n✅ Created unique index on book_id")

    # Summary
    print(f"\n{'='*50}")
    print(f"Migration complete!")
    print(f"  Copies created: {total_copies_created}")
    print(f"  Issues reassigned: {total_issues_reassigned}")

    # Verify: check for duplicates
    pipeline = [
        {"$group": {"_id": "$book_id", "count": {"$sum": 1}}},
        {"$match": {"count": {"$gt": 1}}}
    ]
    dupes = list(books_col.aggregate(pipeline))
    if dupes:
        print(f"\n⚠️  WARNING: {len(dupes)} duplicate book_ids found!")
        for d in dupes:
            print(f"    {d['_id']}: {d['count']} copies")
    else:
        print(f"\n✓ No duplicate book_ids found — all IDs are unique!")

    # Show final state
    final_books = list(books_col.find({}).sort("book_id", 1))
    print(f"\nFinal state: {len(final_books)} book documents")
    for b in final_books:
        print(f"  {b['book_id']:15s}  {b.get('title','?')[:40]:40s}  status={b.get('status','?')}")


if __name__ == "__main__":
    migrate()
