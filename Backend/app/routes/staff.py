"""Staff router — /api/staff"""

from datetime import datetime
from fastapi import APIRouter, HTTPException, Query

from app.database.Mongodb import get_database
from app.models.staff import StaffCreate, StaffUpdate
from app.schemas.book_schema import staff_entity, staff_list_entity
from app.utils.id_generator import generate_staff_id

router = APIRouter()


@router.get("/")
def list_staff(
    search: str = Query("", description="Search by name, email, or phone"),
):
    db = get_database()
    query: dict = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"phone": {"$regex": search, "$options": "i"}},
        ]
    staff = db["staff"].find(query).sort("name", 1)
    return staff_list_entity(staff)


@router.get("/{staff_id}")
def get_staff(staff_id: str):
    db = get_database()
    staff = db["staff"].find_one({"staff_id": staff_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    return staff_entity(staff)


@router.post("/", status_code=201)
def create_staff(data: StaffCreate):
    db = get_database()
    # Prevent duplicate emails
    if db["staff"].find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="A staff member with this email already exists")
    staff_id = generate_staff_id(db)
    doc = {
        "staff_id": staff_id,
        "name": data.name,
        "email": data.email,
        "phone": data.phone,
        "role": data.role,
        "status": "Active",
        "joined_date": datetime.utcnow().date().isoformat(),
    }
    result = db["staff"].insert_one(doc)
    new_staff = db["staff"].find_one({"_id": result.inserted_id})
    return staff_entity(new_staff)


@router.put("/{staff_id}")
def update_staff(staff_id: str, data: StaffUpdate):
    db = get_database()
    if not db["staff"].find_one({"staff_id": staff_id}):
        raise HTTPException(status_code=404, detail="Staff member not found")
    update_data = {k: v for k, v in data.model_dump().items() if v is not None}
    db["staff"].update_one({"staff_id": staff_id}, {"$set": update_data})
    updated = db["staff"].find_one({"staff_id": staff_id})
    return staff_entity(updated)


@router.delete("/{staff_id}")
def delete_staff(staff_id: str):
    db = get_database()
    staff = db["staff"].find_one({"staff_id": staff_id})
    if not staff:
        raise HTTPException(status_code=404, detail="Staff member not found")
    db["staff"].delete_one({"staff_id": staff_id})
    return {"message": f"Staff member {staff_id} deleted successfully"}
