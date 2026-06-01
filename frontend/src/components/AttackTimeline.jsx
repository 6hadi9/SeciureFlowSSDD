import React from "react";

const AttackTimeline = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="timeline-card">
        <h3>Attack Timeline</h3>
        <p className="muted">No attack timeline available.</p>
      </div>
    );
  }

  return (
    <div className="timeline-card">
      <h3>Attack Timeline</h3>
      <div className="timeline-list">
        {timeline.map((stage) => (
          <div key={stage.stage} className="timeline-step">
            <div className="timeline-title">{stage.stage}</div>
            <div className="timeline-items">
              {(stage.items || []).length ? stage.items.join(", ") : "No activity"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AttackTimeline;
