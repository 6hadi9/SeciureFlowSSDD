from flask import Blueprint, request
from utils.security import require_auth
from utils.response import ok
from services.threat_engine import analyze_architecture

bp = Blueprint("analyze", __name__, url_prefix="/api/analyze")


@bp.post("")
@require_auth
def analyze():
    payload = request.get_json() or {}
    nodes = payload.get("nodes", [])
    edges = payload.get("edges", [])

    threats = analyze_architecture(nodes, edges)
    return ok({"threats": threats})
