"""Inspect the live database for duplicate book_ids and show all books + issues."""
import requests, json

BASE = "http://localhost:8000/api"
out_lines = []

def p(s): out_lines.append(s)

# 1. Fetch ALL books
r = requests.get(f"{BASE}/books/")
books = r.json()
p(f"=== ALL BOOKS ({len(books)} documents) ===")
for b in books:
    p(f"  {b['book_id']:15s}  title={b['title'][:40]:40s}  avail={b.get('available_copies')}/{b.get('total_copies')}  status={b.get('status')}")

# 2. Check for duplicate book_ids
from collections import Counter
id_counts = Counter(b['book_id'] for b in books)
dupes = {k: v for k, v in id_counts.items() if v > 1}
p(f"\n=== DUPLICATE BOOK_IDS ({len(dupes)} found) ===")
for bid, count in sorted(dupes.items()):
    matching = [b for b in books if b['book_id'] == bid]
    p(f"  {bid} appears {count} times:")
    for m in matching:
        p(f"    mongo_id={m.get('id','?')[:12]}  title={m['title'][:40]}")

# 3. Fetch ALL issues
r2 = requests.get(f"{BASE}/issues/")
issues = r2.json()
p(f"\n=== ALL ISSUES ({len(issues)} records) ===")
for i in issues:
    p(f"  {i['issue_id']:10s}  book_id={i['book_id']:15s}  member={i['member_id']:15s}  status={i['status']:10s}  book_name={i.get('book_name','?')[:30]}")

# 4. Show members
r3 = requests.get(f"{BASE}/members/")
members = r3.json()
p(f"\n=== ALL MEMBERS ({len(members)}) ===")
for m in members:
    p(f"  {m['member_id']:15s}  name={m['name']:20s}  status={m['status']}")

# Write output
with open("scripts/db_state.txt", "w") as f:
    f.write("\n".join(out_lines))
print("Wrote scripts/db_state.txt")
