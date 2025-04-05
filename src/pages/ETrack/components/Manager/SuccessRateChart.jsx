import React from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import ChartContainer from "../ChartContainer";

// Custom tooltip component for Success Rate Chart
const SuccessRateTooltip = ({ active, payload, label, chartColors }) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="custom-tooltip"
        style={{
          backgroundColor: "white",
          padding: "10px 14px",
          border: "1px solid #ccc",
          borderRadius: "5px",
          boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
        }}
      >
        <p
          className="tooltip-date"
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >{`Date: ${label}`}</p>
        <p
          className="tooltip-rate"
          style={{
            margin: 0,
            color:
              Number(payload[0].value) >= 80
                ? chartColors.success.main
                : chartColors.neutral.dark,
            fontSize: "16px",
          }}
        >{`Success Rate: ${payload[0].value}%`}</p>
      </div>
    );
  }
  return null;
};

// Helper component for ReferenceLine since it wasn't imported
const ReferenceLine = ({ y, stroke, strokeDasharray, label }) => {
  return (
    <g>
      <line
        x1="0%"
        x2="100%"
        y1={y}
        y2={y}
        stroke={stroke}
        strokeDasharray={strokeDasharray}
        strokeWidth={1}
      />
      {label && (
        <text
          x="95%"
          y={y - 5}
          textAnchor="end"
          fill={label.fill}
          fontSize={label.fontSize}
        >
          {label.value}
        </text>
      )}
    </g>
  );
};

const SuccessRateChart = ({
  title,
  data,
  chartColors,
  currentUser,
  currentDateTime,
  selectedDataType,
}) => {
  const gradientId = 
    selectedDataType === "patient_escort" 
      ? "successRateGradient" 
      : "translatorSuccessRateGradient";
  
  const strokeColor = 
    selectedDataType === "patient_escort"
      ? chartColors.success.dark
      : chartColors.primary.translator[1];
  
  const dotStrokeColor = 
    selectedDataType === "patient_escort"
      ? chartColors.success.main
      : chartColors.primary.translator[2];
  
  const activeDotStrokeColor = 
    selectedDataType === "patient_escort"
      ? chartColors.success.dark
      : chartColors.primary.translator[0];
  
  const gradientColor = 
    selectedDataType === "patient_escort"
      ? chartColors.success.accent
      : chartColors.primary.translator[2];

  return (
    <ChartContainer title={title}>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <defs>
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="5%"
                stopColor={gradientColor}
                stopOpacity={0.8}
              />
              <stop
                offset="95%"
                stopColor={gradientColor}
                stopOpacity={0.2}
              />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis
            dataKey="date"
            angle={-45}
            textAnchor="end"
            height={70}
            tick={{ fill: "#555", fontSize: 12 }}
            tickMargin={10}
          />
          <YAxis
            label={{
              value: "Success Rate (%)",
              angle: -90,
              position: "insideLeft",
              style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
            }}
            domain={[0, 100]}
            ticks={[0, 20, 40, 60, 80, 100]}
            tick={{ fill: "#555", fontSize: 12 }}
          />
          <Tooltip content={<SuccessRateTooltip chartColors={chartColors} />} />
          <Legend
            wrapperStyle={{ paddingTop: 10 }}
            verticalAlign="top"
            align="right"
          />
          <Area
            type="monotone"
            dataKey="successRate"
            name="Success Rate Area"
            fill={`url(#${gradientId})`}
            fillOpacity={0.4}
            stroke="none"
          />
          <Line
            type="monotone"
            dataKey="successRate"
            name="Success Rate"
            stroke={strokeColor}
            strokeWidth={3}
            dot={{
              stroke: dotStrokeColor,
              strokeWidth: 2,
              r: 5,
              fill: "white",
            }}
            activeDot={{
              r: 7,
              stroke: activeDotStrokeColor,
              strokeWidth: 2,
            }}
          />
          {/* Add a reference line at 80% - good performance threshold */}
          <ReferenceLine
            y={80}
            stroke={chartColors.neutral.main}
            strokeDasharray="3 3"
            label={{
              position: "right",
              value: "Target (80%)",
              fill: chartColors.neutral.dark,
              fontSize: 12,
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
      <div
        className="chart-timestamp"
        style={{
          textAlign: "right",
          fontSize: "12px",
          color: "#999",
          marginTop: "5px",
        }}
      >
        Data current as of {currentDateTime} • User: {currentUser}
      </div>
    </ChartContainer>
  );
};

export default SuccessRateChart;