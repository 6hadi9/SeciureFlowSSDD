from typing import Dict, List
from services.threat_engine import analyze_architecture

SEVERITY_WEIGHT = {"High": 5, "Medium": 3, "Low": 1}

CATEGORY_MAP = {
    "authentication": {
        "Broken Authentication",
        "Broken Access Control",
        "Broken Session Management",
        "CSRF",
    },
    "encryption": {"Sensitive Data Exposure", "Data Leakage"},
    "accessControl": {"Broken Access Control", "Trust Boundary Violation"},
    "dataProtection": {
        "Sensitive Data Exposure",
        "Insecure Deserialization",
        "Malicious File Upload",
    },
    "networkSecurity": {
        "SSRF",
        "CORS Misconfiguration",
        "Rate Limiting Missing",
        "Supply Chain Attack",
    },
}


def compute_security_score(nodes: List[Dict], edges: List[Dict], threats: List[Dict]):
    if threats is None:
        threats = analyze_architecture(nodes, edges)

    category_scores = {key: 20 for key in CATEGORY_MAP.keys()}
    for threat in threats:
        threat_type = threat.get("type") or threat.get("threat") or threat.get("category")
        weight = SEVERITY_WEIGHT.get(threat.get("severity", "Medium"), 3)
        for category, types in CATEGORY_MAP.items():
            if threat_type in types:
                category_scores[category] = max(0, category_scores[category] - weight)

    overall = sum(category_scores.values())
    rating = "High Risk"
    if overall >= 90:
        rating = "Excellent"
    elif overall >= 75:
        rating = "Good"
    elif overall >= 50:
        rating = "Needs Improvement"

    return {
        "overallScore": overall,
        "rating": rating,
        "categories": category_scores,
    }


def generate_attack_paths(nodes: List[Dict], edges: List[Dict], threats: List[Dict]):
    if threats is None:
        threats = analyze_architecture(nodes, edges)

    nodes_by_id = {node.get("id"): node for node in nodes}
    edges_by_id = {edge.get("id"): edge for edge in edges}
    paths = []

    for threat in threats:
        if threat.get("severity") not in {"High", "Medium"}:
            continue
        edge = edges_by_id.get(threat.get("edgeId"))
        if not edge:
            continue
        source_node = nodes_by_id.get(edge.get("source"), {})
        target_node = nodes_by_id.get(edge.get("target"), {})
        source_label = source_node.get("data", {}).get("label", "Entry")
        target_label = target_node.get("data", {}).get("label", "Target")
        target_type = target_node.get("data", {}).get("componentType", "service")

        impact = "Service Disruption"
        if "database" in target_type:
            impact = "Data Breach"
        if target_type in {"auth-server"}:
            impact = "Account Takeover"
        if target_type in {"payment-gateway"}:
            impact = "Financial Fraud"

        paths.append(
            {
                "entryPoint": source_label,
                "exploitationStep": threat.get("type")
                or threat.get("threat")
                or "Exploit",
                "lateralMovement": f"Pivot to {target_label}",
                "finalImpact": impact,
                "edgeId": threat.get("edgeId"),
                "confidence": threat.get("confidence", "Medium"),
            }
        )

    return paths


def generate_recommendations(threats: List[Dict]):
    recommendations = []
    threats = threats or []

    def add_reco(title, detail, impact):
        recommendations.append(
            {
                "title": title,
                "detail": detail,
                "impact": impact,
            }
        )

    threat_types = [
        (t.get("type") or t.get("threat") or t.get("category")) for t in threats
    ]

    if "Broken Access Control" in threat_types or "Broken Authentication" in threat_types:
        add_reco("Add Authentication", "Require auth on all entry points.", 15)
    if "Sensitive Data Exposure" in threat_types or "Data Leakage" in threat_types:
        add_reco("Enable HTTPS", "Encrypt traffic and data flows.", 12)
    if "Rate Limiting Missing" in threat_types:
        add_reco("Add Rate Limiting", "Throttle public-facing APIs.", 10)
    if "CORS Misconfiguration" in threat_types:
        add_reco("Restrict CORS", "Limit allowed origins and methods.", 8)
    if "CSRF" in threat_types:
        add_reco("Enable CSRF Protection", "Add CSRF tokens for cookie flows.", 8)
    if "Security Misconfiguration" in threat_types:
        add_reco("Harden Configuration", "Disable debug and set secure headers.", 8)

    recommendations.sort(key=lambda item: item["impact"], reverse=True)

    estimated_reduction = min(60, sum(r["impact"] for r in recommendations))

    return {
        "criticalActions": recommendations[:5],
        "estimatedRiskReduction": estimated_reduction,
    }


def generate_attack_timeline(threats: List[Dict]):
    stages = [
        {"stage": "Initial Access", "items": []},
        {"stage": "Privilege Escalation", "items": []},
        {"stage": "Lateral Movement", "items": []},
        {"stage": "Data Exfiltration", "items": []},
    ]

    for threat in threats or []:
        threat_type = threat.get("type") or threat.get("threat") or threat.get("category")
        if threat_type in {"Injection", "SQL Injection", "CSRF", "Broken Authentication"}:
            stages[0]["items"].append(threat_type)
        if threat_type in {"Broken Access Control", "Broken Session Management"}:
            stages[1]["items"].append(threat_type)
        if threat_type in {"SSRF", "Trust Boundary Violation", "Supply Chain Attack"}:
            stages[2]["items"].append(threat_type)
        if threat_type in {"Sensitive Data Exposure", "Data Leakage"}:
            stages[3]["items"].append(threat_type)

    return stages
