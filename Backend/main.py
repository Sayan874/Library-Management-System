from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.config.settings import DB_NAME
from app.routes import books, members, issues, staff
from app.database.Mongodb import (
    get_database,
    connect_to_mongo,
    close_mongo_connection,
    check_mongo_connection,
)

load_dotenv()

app = FastAPI(
    title="Library Management System",
    description="API for managing books, members, and book issues/returns",
    version="1.0.0",
)

# ── App Lifecycle ─────────────────────────────────────────────────────────────
@app.on_event("startup")
async def startup_event():
    connect_to_mongo()


@app.on_event("shutdown")
async def shutdown_event():
    close_mongo_connection()

# ── CORS ──────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(books.router, prefix="/api/books", tags=["Books"])
app.include_router(members.router, prefix="/api/members", tags=["Members"])
app.include_router(issues.router, prefix="/api/issues", tags=["Issues"])
app.include_router(staff.router, prefix="/api/staff", tags=["Staff"])


# ── Root ──────────────────────────────────────────────────────────────────────
@app.get("/")
def root():
    return {"message": "Library Management System API is running"}


@app.get("/api/health/db")
def db_health():
    return {
        "database": DB_NAME,
        "connected": check_mongo_connection(),
    }


# ── Dashboard stats ───────────────────────────────────────────────────────────
@app.get("/api/stats")
def get_stats():
    from datetime import datetime
    db = get_database()
    total_copies = db["books"].count_documents({})
    available_copies = db["books"].count_documents({"status": "Available"})
    total_members = db["members"].count_documents({})
    active_issues = db["issues"].count_documents({"status": "Issued"})
    today_iso = datetime.utcnow().date().isoformat()
    overdue = db["issues"].count_documents(
        {"status": "Issued", "due_date": {"$lt": today_iso}}
    )
    return {
        "total_books": total_copies,
        "total_members": total_members,
        "active_issues": active_issues,
        "overdue": overdue,
        "available_copies": available_copies,
    }
