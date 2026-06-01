import React from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const formatScore = (value) => Math.max(0, Math.min(100, value));

const SecurityScoreCard = ({ score }) => {
  if (!score) {
    return (
      <div className="score-card">
        <h3>Security Score</h3>
        <p className="muted">Run analysis to see the score.</p>
      </div>
    );
  }

  const data = Object.entries(score.categories || {}).map(([key, value]) => ({
    name: key,
    value,
  }));

  return (
    <div className="score-card">
      <div className="score-header">
        <div>
          <h3>Security Score</h3>
          <p className="muted">{score.rating}</p>
        </div>
        <div className="score-value">{formatScore(score.overallScore)}</div>
      </div>
      <div className="score-chart">
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <XAxis type="number" domain={[0, 20]} hide />
            <YAxis type="category" dataKey="name" width={90} />
            <Tooltip />
            {/* Added isAnimationActive={false} right here 👇 */}
            <Bar dataKey="value" fill="#c0402b" radius={[8, 8, 8, 8]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SecurityScoreCard;
