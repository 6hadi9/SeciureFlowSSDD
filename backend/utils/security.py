import datetime
from functools import wraps
import bcrypt
import jwt
from flask import request, current_app


def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")


def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def create_jwt(user_id: str) -> str:
    exp_minutes = current_app.config["JWT_EXP_MIN"]
    payload = {
        "sub": user_id,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=exp_minutes),
        "iat": datetime.datetime.utcnow(),
    }
    return jwt.encode(payload, current_app.config["JWT_SECRET"], algorithm="HS256")


def decode_jwt(token: str):
    return jwt.decode(token, current_app.config["JWT_SECRET"], algorithms=["HS256"])


def require_auth(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return {"error": "Missing token"}, 401
        token = auth_header.replace("Bearer ", "", 1).strip()
        try:
            payload = decode_jwt(token)
        except jwt.PyJWTError:
            return {"error": "Invalid token"}, 401
        request.user_id = payload.get("sub")
        return fn(*args, **kwargs)

    return wrapper
