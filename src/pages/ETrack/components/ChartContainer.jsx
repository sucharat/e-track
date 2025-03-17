import React from "react";
import { ResponsiveContainer } from "recharts";

const ChartContainer = ({ title, children, height = 300 }) => {
  return (
    <div className="chart-container">
      <h2 className="chart-title">{title}</h2>
      <ResponsiveContainer width="100%" height={height}>
        {children}
      </ResponsiveContainer>
    </div>
  );
};

export default ChartContainer;