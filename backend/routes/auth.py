from datetime import datetime
import sqlite3
from flask import Blueprint, request
from extensions import get_db
from utils.security import hash_password, verify_password, create_jwt
from utils.response import ok, fail

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return fail("Email and password required", 400)

    db = get_db()
    existing = db.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
    if existing:
        return fail("Email already registered", 409)

    user = {
        "email": email,
        "passwordHash": hash_password(password),
        "createdAt": datetime.utcnow().isoformat(),
    }
    try:
        cursor = db.execute(
            "INSERT INTO users (email, password_hash, created_at) VALUES (?, ?, ?)",
            (user["email"], user["passwordHash"], user["createdAt"]),
        )
        db.commit()
    except sqlite3.IntegrityError:
        return fail("Email already registered", 409)
    token = create_jwt(str(cursor.lastrowid))
    return ok({"token": token, "user": {"id": str(cursor.lastrowid), "email": email}})


@bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").lower().strip()
    password = data.get("password") or ""

    if not email or not password:
        return fail("Email and password required", 400)

    db = get_db()
    user = db.execute(
        "SELECT id, email, password_hash FROM users WHERE email = ?",
        (email,),
    ).fetchone()
    if not user or not verify_password(password, user["password_hash"]):
        return fail("Invalid credentials", 401)

    token = create_jwt(str(user["id"]))
    return ok({"token": token, "user": {"id": str(user["id"]), "email": email}})
