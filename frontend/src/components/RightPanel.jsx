import React, { useMemo, useState } from "react";
import ThreatList from "./ThreatList.jsx";

const RightPanel = ({
  selected,
  onUpdateSelected,
  threats,
  score,
  attackPaths,
  attackTimeline,
  recommendations,
  ScoreCard,
  AttackPathsPanel,
  AttackTimeline,
  RecommendationsPanel,
  StrideDashboard,
  isCollapsed,
  onToggleCollapse,
}) => {
  const data = selected?.data || {};
  const [openSections, setOpenSections] = useState({
    score: true,
    paths: false,
    recommendations: false,
    stride: false,
    timeline: false,
    summary: false,
    properties: false,
  });

  const handleChange = (field, value) => {
    onUpdateSelected(field, value);
  };

  const sectionCount = useMemo(() => threats.length, [threats.length]);

  const toggleSection = (key) =>
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));

  const AccordionCard = ({ title, isOpen, onToggle, meta, children }) => (
    <div className={`accordion-card ${isOpen ? "open" : ""}`}>
      <button className="accordion-header" onClick={onToggle}>
        <span>{title}</span>
        {meta && <span className="accordion-meta">{meta}</span>}
        <span className="accordion-icon">{isOpen ? "-" : "+"}</span>
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );

  return (
    <aside className={`panel panel-right ${isCollapsed ? "panel-collapsed" : ""}`}>
      <div className="panel-header">
        <div className="panel-title">Security Insights</div>
        <button className="icon-button" onClick={onToggleCollapse}>
          {isCollapsed ? "<<" : ">>"}
        </button>
      </div>
      <div className="panel-scroll">
        <AccordionCard
          title="Security Score"
          isOpen={openSections.score}
          onToggle={() => toggleSection("score")}
        >
          {ScoreCard && <ScoreCard score={score} />}
        </AccordionCard>
        <AccordionCard
          title="Attack Paths"
          meta={attackPaths?.length ? `${attackPaths.length}` : "0"}
          isOpen={openSections.paths}
          onToggle={() => toggleSection("paths")}
        >
          {AttackPathsPanel && <AttackPathsPanel paths={attackPaths} />}
        </AccordionCard>
        <AccordionCard
          title="Recommendations"
          meta={recommendations?.length ? `${recommendations.length}` : "0"}
          isOpen={openSections.recommendations}
          onToggle={() => toggleSection("recommendations")}
        >
          {RecommendationsPanel && (
            <RecommendationsPanel recommendations={recommendations} />
          )}
        </AccordionCard>
        <AccordionCard
          title="STRIDE Dashboard"
          isOpen={openSections.stride}
          onToggle={() => toggleSection("stride")}
        >
          {StrideDashboard && <StrideDashboard threats={threats} />}
        </AccordionCard>
        <AccordionCard
          title="Attack Timeline"
          isOpen={openSections.timeline}
          onToggle={() => toggleSection("timeline")}
        >
          {AttackTimeline && <AttackTimeline timeline={attackTimeline} />}
        </AccordionCard>
        <AccordionCard
          title="Threat Summary"
          meta={`${sectionCount}`}
          isOpen={openSections.summary}
          onToggle={() => toggleSection("summary")}
        >
          <ThreatList threats={threats} />
          <div className="trust-legend">
            <div className="legend-title">Trust Boundaries</div>
            <div className="legend-row"><span className="legend-swatch trust-external" />Internet</div>
            <div className="legend-row"><span className="legend-swatch trust-dmz" />DMZ</div>
            <div className="legend-row"><span className="legend-swatch trust-internal" />Internal Network</div>
            <div className="legend-row"><span className="legend-swatch trust-restricted" />Secure Zone</div>
            <div className="legend-title">Node Heatmap</div>
            <div className="legend-row"><span className="legend-swatch risk-low" />Low</div>
            <div className="legend-row"><span className="legend-swatch risk-med" />Medium</div>
            <div className="legend-row"><span className="legend-swatch risk-high" />High</div>
            <div className="legend-row"><span className="legend-swatch risk-critical" />Critical</div>
          </div>
        </AccordionCard>
        <AccordionCard
          title="Properties"
          isOpen={openSections.properties}
          onToggle={() => toggleSection("properties")}
        >
          {!selected && <p className="muted">Select a node or connection.</p>}
          {selected && (
            <div className="property-grid">
          {selected.kind === "node" && (
            <>
              <label>
                Name
                <input
                  value={data.label || ""}
                  onChange={(event) => handleChange("label", event.target.value)}
                />
              </label>
              <label>
                Trust Level
                <select
                  value={data.trustLevel || "Internal"}
                  onChange={(event) => handleChange("trustLevel", event.target.value)}
                >
                  <option value="External">Internet</option>
                  <option value="DMZ">DMZ</option>
                  <option value="Internal">Internal Network</option>
                  <option value="Restricted">Secure Zone</option>
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.externalInput)}
                  onChange={(event) => handleChange("externalInput", event.target.checked)}
                />
                External Input
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.requiresAuth)}
                  onChange={(event) => handleChange("requiresAuth", event.target.checked)}
                />
                Auth Required
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.usesHTTPS)}
                  onChange={(event) => handleChange("usesHTTPS", event.target.checked)}
                />
                Uses HTTPS
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.handlesSensitiveData)}
                  onChange={(event) => handleChange("handlesSensitiveData", event.target.checked)}
                />
                Handles Sensitive Data
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.secureHeaders)}
                  onChange={(event) => handleChange("secureHeaders", event.target.checked)}
                />
                Secure Headers
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.debugMode)}
                  onChange={(event) => handleChange("debugMode", event.target.checked)}
                />
                Debug Mode Enabled
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.allowsFileUpload)}
                  onChange={(event) => handleChange("allowsFileUpload", event.target.checked)}
                />
                Allows File Upload
              </label>
            </>
          )}
          {selected.kind === "edge" && (
            <>
              <label>
                Data Sensitivity
                <select
                  value={data.dataSensitivity || "Low"}
                  onChange={(event) => handleChange("dataSensitivity", event.target.value)}
                >
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                </select>
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.encrypted)}
                  onChange={(event) => handleChange("encrypted", event.target.checked)}
                />
                Encrypted
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.authenticated)}
                  onChange={(event) => handleChange("authenticated", event.target.checked)}
                />
                Authenticated
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.externalInput)}
                  onChange={(event) => handleChange("externalInput", event.target.checked)}
                />
                External Input
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.rateLimited)}
                  onChange={(event) => handleChange("rateLimited", event.target.checked)}
                />
                Rate Limited
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.usesCookies)}
                  onChange={(event) => handleChange("usesCookies", event.target.checked)}
                />
                Uses Cookies
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.csrfProtected)}
                  onChange={(event) => handleChange("csrfProtected", event.target.checked)}
                />
                CSRF Protection
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.sessionExpiryEnabled)}
                  onChange={(event) => handleChange("sessionExpiryEnabled", event.target.checked)}
                />
                Session Expiry Enabled
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.secureCookies)}
                  onChange={(event) => handleChange("secureCookies", event.target.checked)}
                />
                Secure Cookies
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.deserializationValidated)}
                  onChange={(event) => handleChange("deserializationValidated", event.target.checked)}
                />
                Deserialization Validated
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.corsAllowAll)}
                  onChange={(event) => handleChange("corsAllowAll", event.target.checked)}
                />
                CORS Allow All
              </label>
              <label className="checkbox">
                <input
                  type="checkbox"
                  checked={Boolean(data.fileUpload)}
                  onChange={(event) => handleChange("fileUpload", event.target.checked)}
                />
                File Upload
              </label>
            </>
          )}
            </div>
          )}
        </AccordionCard>
      </div>
    </aside>
  );
};

export default RightPanel;
