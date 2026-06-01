from flask import Blueprint, request
from utils.security import require_auth
from utils.response import ok
from services.threat_engine import analyze_architecture
from services.insights import (
    compute_security_score,
    generate_attack_paths,
    generate_attack_timeline,
    generate_recommendations,
)

bp = Blueprint("insights", __name__, url_prefix="/api/insights")


@bp.post("")
@require_auth
def insights():
    payload = request.get_json() or {}
    nodes = payload.get("nodes", [])
    edges = payload.get("edges", [])
    threats = payload.get("threats")

    if threats is None:
        threats = analyze_architecture(nodes, edges)

    score = compute_security_score(nodes, edges, threats)
    paths = generate_attack_paths(nodes, edges, threats)
    recommendations = generate_recommendations(threats)
    timeline = generate_attack_timeline(threats)

    return ok({
        "score": score,
        "attackPaths": paths,
        "attackTimeline": timeline,
        "recommendations": recommendations,
    })
