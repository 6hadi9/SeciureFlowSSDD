import React from "react";

const AttackPathsPanel = ({ paths }) => {
  if (!paths || paths.length === 0) {
    return (
      <div className="attack-panel">
        <h3>Attack Paths</h3>
        <p className="muted">No attack paths detected.</p>
      </div>
    );
  }

  return (
    <div className="attack-panel">
      <h3>Attack Paths</h3>
      <div className="attack-list">
        {paths.map((path, index) => (
          <div key={`${path.edgeId}-${index}`} className="attack-card">
            <div className="attack-step">
              <span className="attack-label">Entry</span>
              <span>{path.entryPoint}</span>
            </div>
            <div className="attack-step">
              <span className="attack-label">Exploit</span>
              <span>{path.exploitationStep || path.exploitation}</span>
            </div>
            <div className="attack-step">
              <span className="attack-label">Lateral</span>
              <span>{path.lateralMovement}</span>
            </div>
            <div className="attack-step">
              <span className="attack-label">Impact</span>
              <span>{path.finalImpact}</span>
            </div>
            {path.confidence && (
              <div className="attack-confidence">Confidence: {path.confidence}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttackPathsPanel;
