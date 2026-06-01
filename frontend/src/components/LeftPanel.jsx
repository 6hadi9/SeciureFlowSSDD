import React, { useMemo, useState } from "react";
import { COMPONENTS } from "../utils/diagram.js";

const TRUST_LABELS = {
  External: "Internet",
  DMZ: "DMZ",
  Internal: "Internal Network",
  Restricted: "Secure Zone",
};

const CATEGORY_MAP = {
  Users: ["user", "admin"],
  Clients: ["web-client", "mobile-app"],
  Servers: ["api-gateway", "web-server", "app-server", "auth-server", "microservice"],
  Databases: ["database-sql", "database-nosql"],
  "Security Controls": [
    "waf",
    "firewall",
    "ids",
    "ips",
    "vpn-gateway",
    "reverse-proxy",
    "mfa-server",
    "siem",
  ],
  "Network Components": ["load-balancer", "message-queue"],
  "Cloud Services": ["external-api", "third-party", "payment-gateway", "file-storage"],
};

const ICON_MAP = {
  user: "U",
  admin: "A",
  "web-client": "WC",
  "mobile-app": "MA",
  "api-gateway": "AG",
  "web-server": "WS",
  "app-server": "AS",
  "auth-server": "AU",
  microservice: "MS",
  "database-sql": "DB",
  "database-nosql": "DB",
  waf: "W",
  firewall: "FW",
  ids: "ID",
  ips: "IP",
  "vpn-gateway": "VPN",
  "reverse-proxy": "RP",
  "mfa-server": "MFA",
  siem: "SIEM",
  "load-balancer": "LB",
  "message-queue": "MQ",
  "external-api": "API",
  "third-party": "TP",
  "payment-gateway": "PG",
  "file-storage": "FS",
};

const LeftPanel = ({ templates, onLoadTemplate, onAddComponent, isCollapsed, onToggleCollapse }) => {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [search, setSearch] = useState("");

  const categorizedComponents = useMemo(() => {
    const lookup = COMPONENTS.reduce((acc, item) => {
      acc[item.type] = item;
      return acc;
    }, {});

    return Object.keys(CATEGORY_MAP).map((category) => {
      const items = CATEGORY_MAP[category]
        .map((type) => lookup[type])
        .filter(Boolean);
      return { category, items };
    });
  }, []);

  const filteredCategories = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return categorizedComponents;
    return categorizedComponents
      .map(({ category, items }) => ({
        category,
        items: items.filter((item) =>
          item.label.toLowerCase().includes(term) || item.type.includes(term)
        ),
      }))
      .filter(({ items }) => items.length > 0);
  }, [categorizedComponents, search]);

  const handleDragStart = (event, type) => {
    event.dataTransfer.setData("application/secureflow", type);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleSelect = (type) => {
    if (onAddComponent) onAddComponent(type);
    setLibraryOpen(false);
  };

  return (
    <aside className={`panel panel-left ${isCollapsed ? "panel-collapsed" : ""}`}>
      <div className="panel-header">
        <div className="panel-title">Components</div>
        <button className="icon-button" onClick={onToggleCollapse}>
          {isCollapsed ? ">>" : "<<"}
        </button>
      </div>
      <div className="panel-body">
        <div className="component-actions">
          <button className="add-component" onClick={() => setLibraryOpen((prev) => !prev)}>
            Add Component
          </button>
        </div>
        {libraryOpen && (
          <div className="component-dropdown">
            <div className="dropdown-search">
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search components"
              />
            </div>
            <div className="dropdown-list">
              {filteredCategories.length === 0 && (
                <div className="empty-state">No components found.</div>
              )}
              {filteredCategories.map(({ category, items }) => (
                <div key={category} className="dropdown-category">
                  <div className="dropdown-title">{category}</div>
                  <div className="dropdown-items">
                    {items.map((item) => (
                      <button
                        key={item.type}
                        className="dropdown-item"
                        draggable
                        onDragStart={(event) => handleDragStart(event, item.type)}
                        onClick={() => handleSelect(item.type)}
                      >
                        <span className="component-icon">{ICON_MAP[item.type] || "C"}</span>
                        <span className="component-text">
                          <span className="component-label">{item.label}</span>
                          <span className="component-meta">
                            <span className={`pill pill-${item.trustLevel.toLowerCase()}`}>
                              {TRUST_LABELS[item.trustLevel] || item.trustLevel}
                            </span>
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="panel-title">Templates</div>
        <div className="template-list">
          {templates.length === 0 && <p className="muted">No templates loaded.</p>}
          {templates.map((template) => (
            <button
              key={template.id}
              className="template-button"
              onClick={() => onLoadTemplate(template)}
            >
              <div>{template.name}</div>
              <span className="muted">{template.description}</span>
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default LeftPanel;
