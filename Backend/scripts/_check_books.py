import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.database.Mongodb import connect_to_mongo, get_database
connect_to_mongo()
db = get_database()
total = db["books"].count_documents({})
with_thumb = db["books"].count_documents({"thumbnail": {"$exists": True, "$ne": ""}})
print(f"Total books: {total}, with thumbnail: {with_thumb}")
samples = list(db["books"].find({}, {"_id": 0, "book_id": 1, "title": 1, "author": 1, "isbn": 1, "thumbnail": 1}))
for s in samples:
    print(s)
