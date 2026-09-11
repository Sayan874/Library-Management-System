"""
MongoDB connection manager.
Provides connect_to_mongo / close_mongo_connection / get_database / check_mongo_connection.
"""

from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

from app.config.settings import MONGO_URI, DB_NAME

_client: MongoClient | None = None


def connect_to_mongo() -> None:
    global _client
    _client = MongoClient(MONGO_URI)
    print(f"[MongoDB] Connected — database: '{DB_NAME}'")


def close_mongo_connection() -> None:
    global _client
    if _client:
        _client.close()
        _client = None
        print("[MongoDB] Connection closed.")


def get_database():
    """Return the active database. Raises RuntimeError if not yet connected."""
    if _client is None:
        raise RuntimeError("MongoDB client is not initialised. Call connect_to_mongo() first.")
    return _client[DB_NAME]


def check_mongo_connection() -> bool:
    """Return True if the MongoDB server is reachable."""
    try:
        if _client is None:
            return False
        _client.admin.command("ping")
        return True
    except ConnectionFailure:
        return False
