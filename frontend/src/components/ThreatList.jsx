import React, { useMemo, useState } from "react";

const severityClass = (severity) => {
  if (severity === "High") return "badge badge-high";
  if (severity === "Medium") return "badge badge-med";
  return "badge badge-low";
};

const CATEGORY_TAGS = {
  Injection: "INJ",
  "SQL Injection": "INJ",
  "Broken Authentication": "AUTH",
  "Broken Access Control": "AUTH",
  "Sensitive Data Exposure": "DATA",
  "Data Leakage": "DATA",
  "Rate Limiting Missing": "DOS",
  "Trust Boundary Violation": "TRUST",
  "Supply Chain Attack": "SUPPLY",
  "Malicious File Upload": "FILE",
  SSRF: "SSRF",
  CSRF: "CSRF",
  "Security Misconfiguration": "CONFIG",
  "Insecure Deserialization": "DESER",
  "CORS Misconfiguration": "CORS",
};

const ThreatList = ({ threats }) => {
  const [severityFilter, setSeverityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [owaspFilter, setOwaspFilter] = useState("All");
  const [strideFilter, setStrideFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [componentFilter, setComponentFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const availableTypes = useMemo(() => {
    const types = new Set();
    threats.forEach((threat) => types.add(threat.type || threat.threat || threat.category));
    return ["All", ...Array.from(types).filter(Boolean)];
  }, [threats]);

  const availableOwasp = useMemo(() => {
    const values = new Set();
    threats.forEach((threat) => threat.owasp && values.add(threat.owasp));
    return ["All", ...Array.from(values).filter(Boolean)];
  }, [threats]);

  const availableStride = useMemo(() => {
    const values = new Set();
    threats.forEach((threat) => threat.stride && values.add(threat.stride));
    return ["All", ...Array.from(values).filter(Boolean)];
  }, [threats]);

  const availableComponents = useMemo(() => {
    const values = new Set();
    threats.forEach((threat) => {
      if (threat.sourceComponent) values.add(threat.sourceComponent);
      if (threat.targetComponent) values.add(threat.targetComponent);
    });
    return ["All", ...Array.from(values).filter(Boolean)];
  }, [threats]);

  const filtered = threats.filter((threat) => {
    const type = threat.type || threat.threat || threat.category;
    const severityMatch = severityFilter === "All" || threat.severity === severityFilter;
    const typeMatch = typeFilter === "All" || type === typeFilter;
    const owaspMatch = owaspFilter === "All" || threat.owasp === owaspFilter;
    const strideMatch = strideFilter === "All" || threat.stride === strideFilter;
    const statusMatch = statusFilter === "All" || threat.status === statusFilter;
    const componentMatch =
      componentFilter === "All" ||
      threat.sourceComponent === componentFilter ||
      threat.targetComponent === componentFilter;
    const searchMatch =
      !searchTerm ||
      `${type} ${threat.description} ${threat.fix || threat.mitigation || ""}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase());
    return (
      severityMatch &&
      typeMatch &&
      owaspMatch &&
      strideMatch &&
      statusMatch &&
      componentMatch &&
      searchMatch
    );
  });
  if (!threats.length) {
    return <p className="muted">No threats detected.</p>;
  }

  return (
    <div className="threat-list">
      <div className="threat-filters">
        <label>
          Severity
          <select
            value={severityFilter}
            onChange={(event) => setSeverityFilter(event.target.value)}
          >
            <option>All</option>
            <option>High</option>
            <option>Medium</option>
            <option>Low</option>
          </select>
        </label>
        <label>
          Type
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            {availableTypes.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          OWASP
          <select value={owaspFilter} onChange={(event) => setOwaspFilter(event.target.value)}>
            {availableOwasp.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          STRIDE
          <select value={strideFilter} onChange={(event) => setStrideFilter(event.target.value)}>
            {availableStride.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option>All</option>
            <option>Mitigated</option>
            <option>Partially Mitigated</option>
            <option>Unmitigated</option>
          </select>
        </label>
        <label>
          Component
          <select
            value={componentFilter}
            onChange={(event) => setComponentFilter(event.target.value)}
          >
            {availableComponents.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>
        <label>
          Search
          <input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search threats"
          />
        </label>
      </div>
      {filtered.map((threat, index) => {
        const type = threat.type || threat.threat || threat.category;
        const tag = CATEGORY_TAGS[type] || "GEN";
        const status = threat.status || "Unmitigated";
        return (
        <div key={`${threat.edgeId}-${index}`} className="threat-card">
          <div className="threat-header">
            <strong>{type}</strong>
            <span className={severityClass(threat.severity)}>{threat.severity}</span>
          </div>
          <div className="threat-tags">
            <span className="tag">{tag}</span>
            {threat.confidence && <span className="tag">Confidence: {threat.confidence}</span>}
            <span className={`tag status ${status.replace(" ", "-").toLowerCase()}`}>
              {status}
            </span>
          </div>
          {threat.connection && (
            <p className="muted">Connection: {threat.connection}</p>
          )}
          <p>{threat.description}</p>
          <p className="muted">{threat.owasp} • {threat.stride}</p>
          <p className="mitigation">{threat.fix || threat.mitigation}</p>
          {threat.mitigations?.length > 0 && (
            <div className="mitigation-list">
              Mitigations: {threat.mitigations.join(", ")}
            </div>
          )}
        </div>
      );
      })}
    </div>
  );
};

export default ThreatList;
