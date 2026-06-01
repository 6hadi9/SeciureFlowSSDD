import React from "react";

const RecommendationsPanel = ({ recommendations }) => {
  if (!recommendations || !recommendations.criticalActions?.length) {
    return (
      <div className="recommend-panel">
        <h3>Recommendations</h3>
        <p className="muted">No recommendations yet.</p>
      </div>
    );
  }

  return (
    <div className="recommend-panel">
      <h3>Recommendations</h3>
      <div className="recommend-list">
        {recommendations.criticalActions.map((item, index) => (
          <div key={`${item.title}-${index}`} className="recommend-card">
            <div>
              <strong>{item.title}</strong>
              <p className="muted">{item.detail}</p>
            </div>
            <div className="impact">+{item.impact}%</div>
          </div>
        ))}
      </div>
      <div className="recommend-foot">
        Estimated Risk Reduction: {recommendations.estimatedRiskReduction}%
      </div>
    </div>
  );
};

export default RecommendationsPanel;
