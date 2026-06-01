import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const formatScore = (value) => Math.max(0, Math.min(100, value));

const SecurityScoreCard = ({ score }) => {
  const data = useMemo(() => {
    if (!score || !score.categories) return [];
    return Object.entries(score.categories).map(([key, value]) => ({
      name: key,
      value,
    }));
  }, [score]);

  if (!score) {
    return (
      <div className="score-card">
        <h3>Security Score</h3>
        <p className="muted">Run analysis to see the score.</p>
      </div>
    );
  }

  return (
    <div className="score-card">
      <div className="score-header">
        <div>
          <h3>Security Score</h3>
          <p className="muted">{score.rating}</p>
        </div>
        <div className="score-value">{formatScore(score.overallScore)}</div>
      </div>
      <div className="score-chart" style={{ height: "160px", width: "100%", overflow: "hidden" }}>
        <ResponsiveContainer width="99%" height={160} debounce={1}>
          <BarChart data={data} layout="vertical" margin={{ left: 24 }}>
            <XAxis type="number" domain={[0, 20]} hide />
            <YAxis type="category" dataKey="name" width={120} />
            <Bar 
              dataKey="value" 
              fill="#c0402b" 
              radius={[8, 8, 8, 8]} 
              isAnimationActive={false} 
              animationDuration={0} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default SecurityScoreCard;
