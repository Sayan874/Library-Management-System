import os
from dotenv import load_dotenv

# Load environment variables from a .env file in the project's root directory
load_dotenv()

# Google Books API (already used by your controller)
GOOGLE_BOOKS_API_KEY = os.getenv("GOOGLE_BOOKS_API_KEY")

# MongoDB Configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "library_management")