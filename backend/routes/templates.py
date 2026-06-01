from flask import Blueprint
from utils.security import require_auth
from utils.response import ok

bp = Blueprint("templates", __name__, url_prefix="/api/templates")

TEMPLATES = [
    {
        "id": "hospital",
        "name": "Hospital Management System",
        "description": "Patients, portal, clinical API, and records database.",
        "nodes": [
            {"id": "patient", "type": "user", "data": {"label": "Patient", "trustLevel": "External"}},
            {"id": "portal", "type": "web-server", "data": {"label": "Web Portal", "trustLevel": "DMZ", "requiresAuth": True}},
            {"id": "waf", "type": "waf", "data": {"label": "WAF", "trustLevel": "DMZ"}},
            {"id": "api", "type": "api-gateway", "data": {"label": "Clinical API", "trustLevel": "Internal", "handlesSensitiveData": True}},
            {"id": "db", "type": "database-sql", "data": {"label": "Records DB", "trustLevel": "Restricted", "handlesSensitiveData": True}},
        ],
        "edges": [
            {
                "id": "e1",
                "source": "patient",
                "target": "waf",
                "data": {"encrypted": True, "authenticated": False, "dataSensitivity": "Medium", "rateLimited": False},
            },
            {
                "id": "e2",
                "source": "waf",
                "target": "portal",
                "data": {"encrypted": True, "authenticated": True, "dataSensitivity": "Medium"},
            },
            {
                "id": "e3",
                "source": "portal",
                "target": "api",
                "data": {"encrypted": True, "authenticated": True, "dataSensitivity": "High"},
            },
            {
                "id": "e4",
                "source": "api",
                "target": "db",
                "data": {"encrypted": False, "authenticated": True, "dataSensitivity": "High"},
            },
        ],
    },
    {
        "id": "university",
        "name": "University Portal",
        "description": "Student portal with auth and file uploads.",
        "nodes": [
            {"id": "student", "type": "user", "data": {"label": "Student", "trustLevel": "External"}},
            {"id": "portal", "type": "web-server", "data": {"label": "Web App", "trustLevel": "DMZ", "allowsFileUpload": True}},
            {"id": "auth", "type": "auth-server", "data": {"label": "Auth Server", "trustLevel": "Internal"}},
            {"id": "db", "type": "database-sql", "data": {"label": "Student DB", "trustLevel": "Restricted"}},
            {"id": "storage", "type": "file-storage", "data": {"label": "File Storage", "trustLevel": "Internal", "allowsFileUpload": True}},
        ],
        "edges": [
            {"id": "u1", "source": "student", "target": "portal", "data": {"encrypted": True, "authenticated": False, "fileUpload": True}},
            {"id": "u2", "source": "portal", "target": "auth", "data": {"encrypted": True, "authenticated": True}},
            {"id": "u3", "source": "portal", "target": "db", "data": {"encrypted": True, "authenticated": True, "dataSensitivity": "High"}},
            {"id": "u4", "source": "portal", "target": "storage", "data": {"encrypted": False, "authenticated": True, "fileUpload": True}},
        ],
    },
    {
        "id": "social",
        "name": "Social Media Platform",
        "description": "API gateway and microservices with user content.",
        "nodes": [
            {"id": "user", "type": "user", "data": {"label": "User", "trustLevel": "External"}},
            {"id": "gateway", "type": "api-gateway", "data": {"label": "API Gateway", "trustLevel": "Internal"}},
            {"id": "svc", "type": "microservice", "data": {"label": "Feed Service", "trustLevel": "Internal"}},
            {"id": "db", "type": "database-nosql", "data": {"label": "Content DB", "trustLevel": "Restricted"}},
            {"id": "lb", "type": "load-balancer", "data": {"label": "Load Balancer", "trustLevel": "DMZ"}},
        ],
        "edges": [
            {"id": "s1", "source": "user", "target": "lb", "data": {"encrypted": True, "authenticated": False, "rateLimited": False}},
            {"id": "s2", "source": "lb", "target": "gateway", "data": {"encrypted": True, "authenticated": False}},
            {"id": "s3", "source": "gateway", "target": "svc", "data": {"encrypted": True, "authenticated": True}},
            {"id": "s4", "source": "svc", "target": "db", "data": {"encrypted": True, "authenticated": True, "dataSensitivity": "Medium"}},
        ],
    },
    {
        "id": "cloud-storage",
        "name": "Cloud Storage Platform",
        "description": "User storage with file uploads and database.",
        "nodes": [
            {"id": "user", "type": "user", "data": {"label": "User", "trustLevel": "External"}},
            {"id": "portal", "type": "web-server", "data": {"label": "Web App", "trustLevel": "DMZ", "allowsFileUpload": True}},
            {"id": "storage", "type": "file-storage", "data": {"label": "Object Storage", "trustLevel": "Internal", "allowsFileUpload": True}},
            {"id": "db", "type": "database-sql", "data": {"label": "Metadata DB", "trustLevel": "Restricted"}},
            {"id": "firewall", "type": "firewall", "data": {"label": "Firewall", "trustLevel": "DMZ"}},
        ],
        "edges": [
            {"id": "c1", "source": "user", "target": "portal", "data": {"encrypted": False, "authenticated": False, "fileUpload": True}},
            {"id": "c2", "source": "portal", "target": "firewall", "data": {"encrypted": True, "authenticated": True}},
            {"id": "c3", "source": "firewall", "target": "storage", "data": {"encrypted": False, "authenticated": True, "fileUpload": True}},
            {"id": "c4", "source": "portal", "target": "db", "data": {"encrypted": True, "authenticated": True, "dataSensitivity": "High"}},
        ],
    },
    {
        "id": "government",
        "name": "Government Citizen Portal",
        "description": "Citizen portal with secure records and MFA.",
        "nodes": [
            {"id": "citizen", "type": "user", "data": {"label": "Citizen", "trustLevel": "External"}},
            {"id": "portal", "type": "web-server", "data": {"label": "Portal", "trustLevel": "DMZ"}},
            {"id": "auth", "type": "auth-server", "data": {"label": "Auth Service", "trustLevel": "Internal"}},
            {"id": "mfa", "type": "mfa-server", "data": {"label": "MFA Server", "trustLevel": "Internal"}},
            {"id": "records", "type": "database-sql", "data": {"label": "Records DB", "trustLevel": "Restricted", "handlesSensitiveData": True}},
        ],
        "edges": [
            {"id": "g1", "source": "citizen", "target": "portal", "data": {"encrypted": True, "authenticated": False}},
            {"id": "g2", "source": "portal", "target": "auth", "data": {"encrypted": True, "authenticated": True}},
            {"id": "g3", "source": "auth", "target": "mfa", "data": {"encrypted": True, "authenticated": True}},
            {"id": "g4", "source": "portal", "target": "records", "data": {"encrypted": False, "authenticated": True, "dataSensitivity": "High"}},
        ],
    },
    {
        "id": "smart-home",
        "name": "Smart Home IoT",
        "description": "Mobile control of IoT devices via API.",
        "nodes": [
            {"id": "mobile", "type": "mobile-app", "data": {"label": "Mobile App", "trustLevel": "External"}},
            {"id": "api", "type": "api-gateway", "data": {"label": "IoT API", "trustLevel": "Internal"}},
            {"id": "device", "type": "external-api", "data": {"label": "IoT Device", "trustLevel": "External"}},
            {"id": "vpn", "type": "vpn-gateway", "data": {"label": "VPN Gateway", "trustLevel": "DMZ"}},
        ],
        "edges": [
            {"id": "i1", "source": "mobile", "target": "api", "data": {"encrypted": False, "authenticated": False}},
            {"id": "i2", "source": "api", "target": "vpn", "data": {"encrypted": True, "authenticated": True}},
            {"id": "i3", "source": "vpn", "target": "device", "data": {"encrypted": False, "authenticated": False}},
        ],
    },
]


@bp.get("")
@require_auth
def list_templates():
    return ok({"items": TEMPLATES})
