from pymongo import MongoClient
from pymongo.database import Database
from app.config.settings import MONGO_URI, MONGO_DB_NAME

_client: MongoClient = None
_db: Database = None

def get_database() -> Database:
    """
    Establishes a connection to MongoDB if one doesn't exist and returns the database object.
    This uses a singleton pattern for the client to avoid creating multiple connections.
    """
    global _client, _db
    
    if _client is None:
        try:
            print("Attempting to connect to MongoDB...")
            _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            # The 'ping' command is a lightweight way to verify that the client
            # can connect to the server.
            _client.admin.command('ping')
            print("✅ MongoDB connection successful.")
            _db = _client[MONGO_DB_NAME]
        except Exception as e:
            print(f"❌ Could not connect to MongoDB: {e}")
            # If connection fails, we should not proceed.
            raise ConnectionError(f"Failed to connect to MongoDB: {e}") from e

    if _db is None:
        raise Exception("Database not initialized. Check your connection.")
        
    return _db