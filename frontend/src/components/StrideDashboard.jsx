import React, { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

const StrideDashboard = ({ threats }) => {
  const data = useMemo(() => {
    const counts = {
      Spoofing: 0,
      Tampering: 0,
      Repudiation: 0,
      "Information Disclosure": 0,
      "Denial of Service": 0,
      "Elevation of Privilege": 0,
    };

    (threats || []).forEach((threat) => {
      const key = threat.stride || "Other";
      if (counts[key] !== undefined) {
        counts[key] += 1;
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [threats]);

  return (
    <div className="stride-card">
      <h3>STRIDE Coverage</h3>
      <div className="stride-chart" style={{ height: "200px", width: "100%", overflow: "hidden" }}>
        <ResponsiveContainer width="99%" height={200} debounce={1}>
          <BarChart data={data} margin={{ left: 12 }}>
            <XAxis dataKey="name" hide />
            <YAxis allowDecimals={false} />
            <Bar 
              dataKey="value" 
              fill="#1e1b18" 
              radius={[8, 8, 0, 0]} 
              isAnimationActive={false} 
              animationDuration={0} 
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="stride-list">
        {data.map((item) => (
          <div key={item.name} className="stride-row">
            <span>{item.name}</span>
            <span>{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StrideDashboard;
