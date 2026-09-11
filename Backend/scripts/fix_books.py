import sys
import os

from app.database.Mongodb import connect_to_mongo, get_database, close_mongo_connection

def fix_all_books():
    connect_to_mongo()
    db = get_database()
    count = 0
    books = db["books"].find()
    
    for b in books:
        # If total_copies is missing, derive it from whatever data was there to be safe
        total_copies = b.get("total_copies", b.get("available_copies", 1))
        
        # Calculate active issues mathematically
        issued_count = db["issues"].count_documents({"book_id": b["book_id"], "return_date": None})
        new_available = max(0, total_copies - issued_count)
        
        # Update the book
        db["books"].update_one(
            {"_id": b["_id"]},
            {"$set": {
                "total_copies": total_copies,
                "available_copies": new_available,
                "status": "Available" if new_available > 0 else "Unavailable"
            }}
        )
        count += 1
        
    print(f"✅ Fixed {count} books by recalculating against actual database issuing records. Restart the page!")
    close_mongo_connection()

if __name__ == "__main__":
    fix_all_books()
