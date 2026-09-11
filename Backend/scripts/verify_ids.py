import requests, json

r = requests.post(
    "http://localhost:8000/api/books/",
    json={"title": "Atomic Habits", "author": "James Clear", "isbn": "9780735211292", "total_copies": 3}
)
print("HTTP", r.status_code)
try:
    d = r.json()
    if isinstance(d, list):
        ids = [b.get("book_id") for b in d]
        for i, b in enumerate(d):
            print(f"  Copy {i+1}: {b['book_id']}  |  title={b['title']}")
        print("All unique:", len(set(ids)) == len(ids))
        # cleanup test copies
        for b in d:
            del_r = requests.delete(f"http://localhost:8000/api/books/{b['book_id']}")
            print(f"  Deleted {b['book_id']}: HTTP {del_r.status_code}")
    else:
        print(json.dumps(d, indent=2)[:400])
except Exception as e:
    print("Error:", e)
    print(r.text[:400])
