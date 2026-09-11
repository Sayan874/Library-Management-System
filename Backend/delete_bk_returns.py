from pymongo import MongoClient

client = MongoClient("mongodb://localhost:27017")
db = client["library_management_system"]

# All current book IDs in DB
book_ids_in_db = {b["book_id"] for b in db["books"].find({}, {"book_id": 1, "_id": 0})}

# Find all issues whose book_id doesn't exist in books collection
all_issues = list(db["issues"].find({}, {"issue_id": 1, "book_id": 1, "status": 1, "_id": 0}))
orphaned_ids = [i["issue_id"] for i in all_issues if i.get("book_id") not in book_ids_in_db]

print(f"Found {len(orphaned_ids)} orphaned issue record(s) to delete:")
for oid in orphaned_ids:
    print(f"  {oid}")

result = db["issues"].delete_many({"issue_id": {"$in": orphaned_ids}})
print(f"\nDeleted {result.deleted_count} record(s) successfully!")

client.close()
