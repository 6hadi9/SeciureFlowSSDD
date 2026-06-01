from typing import Dict, List

OWASP_MAP = {
    "Broken Authentication": "A07:2021-Identification and Authentication Failures",
    "Broken Access Control": "A01:2021-Broken Access Control",
    "Injection": "A03:2021-Injection",
    "SQL Injection": "A03:2021-Injection",
    "Sensitive Data Exposure": "A02:2021-Cryptographic Failures",
    "SSRF": "A10:2021-Server-Side Request Forgery",
    "Supply Chain Attack": "A06:2021-Vulnerable and Outdated Components",
    "Trust Boundary Violation": "A01:2021-Broken Access Control",
    "Malicious File Upload": "A08:2021-Software and Data Integrity Failures",
    "Rate Limiting Missing": "A04:2021-Insecure Design",
    "Data Leakage": "A02:2021-Cryptographic Failures",
    "Security Misconfiguration": "A05:2021-Security Misconfiguration",
    "Broken Session Management": "A07:2021-Identification and Authentication Failures",
    "CORS Misconfiguration": "A05:2021-Security Misconfiguration",
    "Insecure Deserialization": "A08:2021-Software and Data Integrity Failures",
    "CSRF": "A01:2021-Broken Access Control",
}

STRIDE_MAP = {
    "Broken Authentication": "Spoofing",
    "Broken Access Control": "Elevation of Privilege",
    "Injection": "Tampering",
    "SQL Injection": "Tampering",
    "Sensitive Data Exposure": "Information Disclosure",
    "SSRF": "Tampering",
    "Supply Chain Attack": "Tampering",
    "Trust Boundary Violation": "Elevation of Privilege",
    "Malicious File Upload": "Tampering",
    "Rate Limiting Missing": "Denial of Service",
    "Data Leakage": "Information Disclosure",
    "Security Misconfiguration": "Information Disclosure",
    "Broken Session Management": "Spoofing",
    "CORS Misconfiguration": "Information Disclosure",
    "Insecure Deserialization": "Tampering",
    "CSRF": "Tampering",
}

COMPONENT_CONTROLS = {
    "waf": "WAF",
    "firewall": "Firewall",
    "ids": "IDS",
    "ips": "IPS",
    "vpn-gateway": "VPN",
    "reverse-proxy": "Reverse Proxy",
    "mfa-server": "MFA",
    "siem": "SIEM",
    "load-balancer": "Load Balancer",
}

MITIGATION_RULES = {
    "Injection": {"primary": {"WAF", "IPS", "Reverse Proxy"}},
    "SQL Injection": {"primary": {"WAF", "IPS", "Reverse Proxy"}},
    "Broken Authentication": {
        "primary": {"MFA", "Auth", "Session Expiry", "Secure Cookies"}
    },
    "Broken Access Control": {"primary": {"Auth", "MFA"}},
    "CSRF": {"primary": {"CSRF Protection", "Secure Cookies"}},
    "Sensitive Data Exposure": {"primary": {"TLS"}},
    "Data Leakage": {"primary": {"TLS"}},
    "Rate Limiting Missing": {"primary": {"Rate Limiting"}},
    "Security Misconfiguration": {"primary": {"HTTPS", "Security Headers"}},
    "CORS Misconfiguration": {"primary": {"CORS Restricted"}},
    "Insecure Deserialization": {"primary": {"Deserialization Validated"}},
    "Malicious File Upload": {"primary": {"WAF", "IPS"}},
    "SSRF": {"primary": {"Firewall", "Reverse Proxy"}},
    "Trust Boundary Violation": {"primary": {"Firewall", "VPN"}},
    "Supply Chain Attack": {"primary": {"SIEM"}},
}


def analyze_architecture(nodes: List[Dict], edges: List[Dict]) -> List[Dict]:
    nodes_by_id = {node.get("id"): node for node in nodes}
    threats = []
    seen = {}

    for edge in edges:
        edge_id = edge.get("id")
        data = edge.get("data", {}) or {}
        source_node = nodes_by_id.get(edge.get("source"), {})
        target_node = nodes_by_id.get(edge.get("target"), {})

        source_data = source_node.get("data", {}) or {}
        target_data = target_node.get("data", {}) or {}
        source_type = source_data.get("componentType")
        target_type = target_data.get("componentType")
        source_label = source_data.get("label", source_type or "Source")
        target_label = target_data.get("label", target_type or "Target")

        context = {
            "edge_id": edge_id,
            "source_type": source_type,
            "target_type": target_type,
            "source_label": source_label,
            "target_label": target_label,
            "source_trust": source_data.get("trustLevel", "Internal"),
            "target_trust": target_data.get("trustLevel", "Internal"),
            "encrypted": bool(data.get("encrypted", True)),
            "authenticated": bool(data.get("authenticated", True)),
            "external_input": bool(data.get("externalInput", False))
            or bool(source_data.get("externalInput")),
            "requires_auth": bool(source_data.get("requiresAuth", False))
            or bool(target_data.get("requiresAuth", False)),
            "uses_https": bool(source_data.get("usesHTTPS", False))
            or bool(target_data.get("usesHTTPS", False)),
            "secure_headers": bool(source_data.get("secureHeaders", False))
            or bool(target_data.get("secureHeaders", False)),
            "debug_mode": bool(source_data.get("debugMode", False))
            or bool(target_data.get("debugMode", False)),
            "sensitive": bool(source_data.get("handlesSensitiveData", False))
            or bool(target_data.get("handlesSensitiveData", False))
            or data.get("dataSensitivity") == "High",
            "rate_limited": bool(data.get("rateLimited", True)),
            "file_upload": bool(data.get("fileUpload", False))
            or bool(source_data.get("allowsFileUpload", False))
            or bool(target_data.get("allowsFileUpload", False)),
            "uses_cookies": bool(data.get("usesCookies", False)),
            "csrf_protected": bool(data.get("csrfProtected", True)),
            "session_expiry": bool(data.get("sessionExpiryEnabled", True)),
            "secure_cookies": bool(data.get("secureCookies", True)),
            "deserialization_validated": bool(data.get("deserializationValidated", True)),
            "cors_allow_all": bool(data.get("corsAllowAll", False)),
            "data_sensitivity": data.get("dataSensitivity", "Low"),
        }

        context["controls"] = collect_controls(context)

        for rule in RULES:
            for threat in rule(context):
                key = f"{edge_id}:{threat['type']}"
                threat = apply_mitigation_status(threat, context)
                threat = apply_severity_adjustments(threat, context)
                existing = seen.get(key)
                if existing:
                    seen[key] = stronger_threat(existing, threat)
                else:
                    seen[key] = threat

    threats.extend(seen.values())
    return threats


def build_threat(context, threat, severity, description, fix, confidence="Medium"):
    return {
        "edgeId": context["edge_id"],
        "connection": f"{context['source_label']} -> {context['target_label']}",
        "sourceComponent": context["source_label"],
        "targetComponent": context["target_label"],
        "threat": threat,
        "type": threat,
        "owasp": OWASP_MAP.get(threat, "A04:2021-Insecure Design"),
        "stride": STRIDE_MAP.get(threat, "Other"),
        "description": description,
        "fix": fix,
        "severity": severity,
        "confidence": confidence,
        "status": "Unmitigated",
        "mitigations": [],
    }


def stronger_threat(existing, incoming):
    order = {"Low": 1, "Medium": 2, "High": 3}
    if order.get(incoming["severity"], 0) > order.get(existing["severity"], 0):
        return incoming
    return existing


def apply_severity_adjustments(threat, context):
    severity = threat["severity"]
    bump = 0
    if context["source_trust"] == "External" and context["target_trust"] != "External":
        bump += 1
    if context["sensitive"] or context["data_sensitivity"] == "High":
        bump += 1
    if context["source_trust"] == "External":
        bump += 1

    severity = increase_severity(severity, bump)
    threat["severity"] = severity
    return threat


def collect_controls(context):
    controls = set()
    for key in (context.get("source_type"), context.get("target_type")):
        if key in COMPONENT_CONTROLS:
            controls.add(COMPONENT_CONTROLS[key])

    if context.get("authenticated"):
        controls.add("Auth")
    if context.get("encrypted"):
        controls.add("TLS")
    if context.get("uses_https"):
        controls.add("HTTPS")
    if context.get("secure_headers"):
        controls.add("Security Headers")
    if context.get("rate_limited"):
        controls.add("Rate Limiting")
    if context.get("csrf_protected"):
        controls.add("CSRF Protection")
    if context.get("session_expiry"):
        controls.add("Session Expiry")
    if context.get("secure_cookies"):
        controls.add("Secure Cookies")
    if context.get("deserialization_validated"):
        controls.add("Deserialization Validated")
    if not context.get("cors_allow_all"):
        controls.add("CORS Restricted")

    return controls


def apply_mitigation_status(threat, context):
    rule = MITIGATION_RULES.get(threat["type"], None)
    if not rule:
        return threat

    primary = rule.get("primary", set())
    controls = context.get("controls", set())
    present = sorted(primary.intersection(controls))
    threat["mitigations"] = present

    if present and len(present) >= len(primary):
        threat["status"] = "Mitigated"
        threat["severity"] = decrease_severity(threat["severity"], 1)
    elif present:
        threat["status"] = "Partially Mitigated"
    else:
        threat["status"] = "Unmitigated"

    return threat


def decrease_severity(severity, steps):
    order = ["Low", "Medium", "High"]
    idx = order.index(severity) if severity in order else 1
    idx = max(0, idx - steps)
    return order[idx]


def increase_severity(severity, steps):
    order = ["Low", "Medium", "High"]
    idx = order.index(severity) if severity in order else 1
    idx = min(len(order) - 1, idx + steps)
    return order[idx]


def rule_missing_auth(context):
    if context["requires_auth"] and not context["authenticated"]:
        return [
            build_threat(
                context,
                "Broken Access Control",
                "High",
                "Connection lacks required authentication.",
                "Use JWT, mTLS, or signed service credentials.",
                "High",
            )
        ]
    return []


def rule_unencrypted_sensitive(context):
    if not context["encrypted"] and context["sensitive"]:
        return [
            build_threat(
                context,
                "Sensitive Data Exposure",
                "High",
                "Sensitive data flows without encryption.",
                "Use TLS for all sensitive traffic and rotate keys.",
                "High",
            )
        ]
    if not context["encrypted"]:
        return [
            build_threat(
                context,
                "Data Leakage",
                "Medium",
                "Unencrypted data flow could be intercepted.",
                "Use TLS for all data flows.",
                "Medium",
            )
        ]
    return []


def rule_trust_boundary(context):
    external = {"External"}
    if context["source_trust"] in external and context["target_trust"] not in external:
        return [
            build_threat(
                context,
                "Trust Boundary Violation",
                "High",
                "External input crosses into an internal trust zone.",
                "Validate input, enforce auth, and add strict boundary checks.",
                "High",
            )
        ]
    return []


def rule_user_to_api(context):
    if context["source_type"] in {"user", "web-client", "mobile-app"} and context["target_type"] in {
        "api-gateway",
        "app-server",
        "microservice",
    }:
        threats = [
            build_threat(
                context,
                "Injection",
                "High",
                "Untrusted client input reaches API layer.",
                "Validate input and use parameterized queries.",
                "High",
            ),
            build_threat(
                context,
                "Broken Authentication",
                "High",
                "User-to-API flow requires strong authentication.",
                "Use MFA, strong session controls, and token rotation.",
                "High",
            ),
        ]
        if not context["rate_limited"]:
            threats.append(
                build_threat(
                    context,
                    "Rate Limiting Missing",
                    "Medium",
                    "No rate limiting on public API entry point.",
                    "Apply IP-based throttling and request quotas.",
                    "Medium",
                )
            )
        return threats
    return []


def rule_api_to_database(context):
    if context["source_type"] in {"api-gateway", "app-server", "microservice"} and context[
        "target_type"
    ] in {"database-sql", "database-nosql"}:
        threats = [
            build_threat(
                context,
                "SQL Injection",
                "High",
                "API calls database without strict query controls.",
                "Use parameterized queries and ORM safe APIs.",
                "High",
            )
        ]
        if context["sensitive"]:
            threats.append(
                build_threat(
                    context,
                    "Sensitive Data Exposure",
                    "High",
                    "Sensitive data stored or retrieved without safeguards.",
                    "Encrypt data at rest and restrict database access.",
                    "High",
                )
            )
        return threats
    return []


def rule_web_to_external_api(context):
    if context["source_type"] in {"web-server", "api-gateway"} and context["target_type"] in {
        "external-api",
        "third-party",
        "payment-gateway",
    }:
        return [
            build_threat(
                context,
                "SSRF",
                "High",
                "Server initiates outbound requests to external services.",
                "Implement allowlists and sanitize outbound URLs.",
                "High",
            ),
            build_threat(
                context,
                "Data Leakage",
                "Medium",
                "Sensitive data may be sent to third parties.",
                "Minimize data sharing and redact sensitive fields.",
                "Medium",
            ),
        ]
    return []


def rule_external_to_internal(context):
    if context["source_trust"] == "External" and context["target_trust"] != "External":
        return [
            build_threat(
                context,
                "Supply Chain Attack",
                "High",
                "External service sends data into internal systems.",
                "Validate payloads and verify third-party integrity.",
                "High",
            ),
            build_threat(
                context,
                "Trust Boundary Violation",
                "High",
                "External data crosses into internal trust zone.",
                "Add strict validation and authorization gates.",
                "High",
            ),
        ]
    return []


def rule_file_upload(context):
    if context["file_upload"]:
        return [
            build_threat(
                context,
                "Malicious File Upload",
                "High",
                "File uploads can deliver malware or executable payloads.",
                "Scan files, restrict types, and store in isolated buckets.",
                "High",
            )
        ]
    return []


def rule_csrf(context):
    if (
        context["source_type"] in {"web-client", "user"}
        and context["target_type"] in {"web-server", "api-gateway", "app-server"}
        and context["uses_cookies"]
        and not context["csrf_protected"]
    ):
        return [
            build_threat(
                context,
                "CSRF",
                "High",
                "Cookie-based auth without CSRF protection.",
                "Add CSRF tokens and SameSite=strict cookies.",
                "High",
            )
        ]
    return []


def rule_insecure_deserialization(context):
    if (
        context["external_input"]
        and context["target_type"] in {"app-server", "microservice"}
        and not context["deserialization_validated"]
    ):
        return [
            build_threat(
                context,
                "Insecure Deserialization",
                "High",
                "External data is deserialized without validation.",
                "Use safe parsers and validate schemas before deserialization.",
                "High",
            )
        ]
    return []


def rule_security_misconfiguration(context):
    if not context["uses_https"] or not context["secure_headers"] or context["debug_mode"]:
        return [
            build_threat(
                context,
                "Security Misconfiguration",
                "Medium",
                "Security headers/HTTPS or debug settings are misconfigured.",
                "Enable HTTPS, add security headers, and disable debug mode.",
                "Medium",
            )
        ]
    return []


def rule_broken_session_management(context):
    if context["authenticated"] and (not context["session_expiry"] or not context["secure_cookies"]):
        return [
            build_threat(
                context,
                "Broken Session Management",
                "High",
                "Sessions lack expiry or secure cookie flags.",
                "Set session expiry, HttpOnly, Secure, and SameSite flags.",
                "High",
            )
        ]
    return []


def rule_cors_misconfiguration(context):
    if context["target_type"] in {"api-gateway", "app-server"} and context["cors_allow_all"]:
        return [
            build_threat(
                context,
                "CORS Misconfiguration",
                "Medium",
                "API allows all origins, increasing exposure.",
                "Restrict allowed origins and methods.",
                "Medium",
            )
        ]
    return []


RULES = [
    rule_missing_auth,
    rule_unencrypted_sensitive,
    rule_trust_boundary,
    rule_user_to_api,
    rule_api_to_database,
    rule_web_to_external_api,
    rule_external_to_internal,
    rule_file_upload,
    rule_csrf,
    rule_insecure_deserialization,
    rule_security_misconfiguration,
    rule_broken_session_management,
    rule_cors_misconfiguration,
]
