from datetime import datetime
import json
from flask import Blueprint, request
from extensions import get_db
from utils.security import require_auth
from utils.response import ok, fail

bp = Blueprint("projects", __name__, url_prefix="/api/projects")


def serialize_project(row):
    return {
        "id": str(row["id"]),
        "name": row["name"],
        "nodes": json.loads(row["nodes"]),
        "edges": json.loads(row["edges"]),
        "threats": json.loads(row["threats"]),
        "updatedAt": row["updated_at"],
        "createdAt": row["created_at"],
    }


@bp.get("")
@require_auth
def list_projects():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC",
        (request.user_id,),
    ).fetchall()
    return ok({"items": [serialize_project(row) for row in rows]})


@bp.post("")
@require_auth
def create_project():
    data = request.get_json() or {}
    name = data.get("name") or "Untitled"

    now = datetime.utcnow().isoformat()
    db = get_db()
    cursor = db.execute(
        """
        INSERT INTO projects (user_id, name, nodes, edges, threats, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            request.user_id,
            name,
            json.dumps(data.get("nodes", [])),
            json.dumps(data.get("edges", [])),
            json.dumps(data.get("threats", [])),
            now,
            now,
        ),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM projects WHERE id = ?",
        (cursor.lastrowid,),
    ).fetchone()
    return ok({"project": serialize_project(row)}, 201)


@bp.get("/<project_id>")
@require_auth
def get_project(project_id):
    db = get_db()
    row = db.execute(
        "SELECT * FROM projects WHERE id = ? AND user_id = ?",
        (project_id, request.user_id),
    ).fetchone()
    if not row:
        return fail("Project not found", 404)
    return ok({"project": serialize_project(row)})


@bp.put("/<project_id>")
@require_auth
def update_project(project_id):
    data = request.get_json() or {}
    db = get_db()
    db.execute(
        """
        UPDATE projects
        SET name = ?, nodes = ?, edges = ?, threats = ?, updated_at = ?
        WHERE id = ? AND user_id = ?
        """,
        (
            data.get("name") or "Untitled",
            json.dumps(data.get("nodes", [])),
            json.dumps(data.get("edges", [])),
            json.dumps(data.get("threats", [])),
            datetime.utcnow().isoformat(),
            project_id,
            request.user_id,
        ),
    )
    db.commit()
    row = db.execute(
        "SELECT * FROM projects WHERE id = ? AND user_id = ?",
        (project_id, request.user_id),
    ).fetchone()
    if not row:
        return fail("Project not found", 404)
    return ok({"project": serialize_project(row)})


@bp.delete("/<project_id>")
@require_auth
def delete_project(project_id):
    db = get_db()
    cursor = db.execute(
        "DELETE FROM projects WHERE id = ? AND user_id = ?",
        (project_id, request.user_id),
    )
    db.commit()
    if cursor.rowcount == 0:
        return fail("Project not found", 404)
    return ok({"status": "deleted"})
