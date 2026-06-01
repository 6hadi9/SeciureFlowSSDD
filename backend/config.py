import os


class Config:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    SQLITE_PATH = os.getenv("SQLITE_PATH", os.path.join(BASE_DIR, "database.db"))
    JWT_SECRET = os.getenv("JWT_SECRET", "change_me")
    JWT_EXP_MIN = int(os.getenv("JWT_EXP_MIN", "120"))
    CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*")
    SOCKETIO_ASYNC_MODE = os.getenv("SOCKETIO_ASYNC_MODE", "threading")
