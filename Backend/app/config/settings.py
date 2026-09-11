import os
from dotenv import load_dotenv

load_dotenv(override=True)

# MongoDB
MONGO_URI: str = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DB_NAME: str = os.getenv("DB_NAME", "library_db")

# Fine settings (rupees per overdue day)
FINE_PER_DAY: float = float(os.getenv("FINE_PER_DAY", "5.0"))

# Google Books API (optional — leave blank to skip auth)
GOOGLE_BOOKS_API_KEY: str = os.getenv("GOOGLE_BOOKS_API_KEY", "")