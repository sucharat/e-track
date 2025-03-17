import React from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ComposedChart,
  Area,
  RadialBarChart,
  RadialBar,
  LabelList,
} from "recharts";
import ChartContainer from "../ChartContainer";
import HeatMapCalendar from "./HeatMapCalendar";
import SuccessRateChart from "./SuccessRateChart";

export const CHART_COLORS = {
  primary: {
    escort: [
      "#004d40",
      "#00695c",
      "#00796b",
      "#00897b",
      "#009688",
      "#26a69a",
      "#4db6ac",
      "#80cbc4",
    ],
    translator: [
      "#1565c0", // Deep Blue
      "#5c6bc0", // Indigo
      "#7986cb", // Lighter Indigo
      "#3949ab", // Dark Indigo
      "#7e57c2", // Purple
      "#5e35b1", // Deep Purple
      "#3f51b5", // Primary Blue
      "#4527a0", // Deep Purple Dark
    ],
  },
  success: {
    // Keep success colors the same for consistency
    main: "#2e7d32",
    light: "#4caf50",
    dark: "#1b5e20",
    gradient: ["#c8e6c9", "#81c784", "#4caf50", "#2e7d32"],
    accent: "#00c853",
  },
  neutral: {
    main: "#78909c",
    light: "#b0bec5",
    dark: "#546e7a",
    gradient: ["#eceff1", "#cfd8dc", "#b0bec5", "#90a4ae"],
  },
  accent: {
    orange: "#ff7043", // Deeper orange
    purple: "#7e57c2", // More vibrant purple
    cyan: "#00acc1", // Brighter cyan
    amber: "#ffb300", // Warmer amber
    pink: "#ec407a", // Brighter pink
    teal: "#00897b", // Slightly darker teal
    indigo: "#3949ab", // New indigo
    blue: "#1e88e5", // New blue
    deepPurple: "#5e35b1", // New deep purple
    lightBlue: "#039be5", // New light blue
  },
};

// Custom tooltip component for Handling Time Chart
const HandlingTimeTooltip = ({ active, payload, label }) => {
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
          style={{
            margin: 0,
            fontSize: "14px",
            fontWeight: "bold",
            marginBottom: "5px",
          }}
        >{`${label}`}</p>
        <p style={{ margin: 0, fontSize: "16px" }}>
          <span
            style={{
              display: "inline-block",
              width: "12px",
              height: "12px",
              backgroundColor: payload[0].color,
              marginRight: "5px",
              borderRadius: "3px",
            }}
          ></span>
          {`${payload[0].value} requests`}
        </p>
      </div>
    );
  }
  return null;
};

// Format large numbers with commas
const formatNumber = (num) => {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

// Format percentage with one decimal place
const formatPercent = (percent) => {
  return `${parseFloat(percent).toFixed(1)}%`;
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

const ChartSection = ({
  selectedDataType,
  visibleCharts,
  filteredDepartmentDistribution,
  filteredLanguageDistribution,
  filteredCoordRequests,
  filteredRequests,
  dateRange,
  COLORS,
  currentUser,
  currentDateTime,
}) => {
  // กำหนดวันเริ่มต้นและวันสิ้นสุดสำหรับ (Heat Map)
  const startDate = dateRange.startDate
    ? new Date(dateRange.startDate)
    : new Date(new Date().setFullYear(new Date().getFullYear() - 1));
  const endDate = dateRange.endDate ? new Date(dateRange.endDate) : new Date();

  const themeColors =
    selectedDataType === "patient_escort"
      ? CHART_COLORS.primary.escort
      : CHART_COLORS.primary.translator;

  const mainColor =
    selectedDataType === "patient_escort"
      ? CHART_COLORS.primary.escort[2]
      : CHART_COLORS.primary.translator[2];

  const calculateSuccessRate = (requests) => {
    const requestsByDate = {};

    requests.forEach((req) => {
      if (!req.request_date) return;

      const date = req.request_date;
      if (!requestsByDate[date]) {
        requestsByDate[date] = { total: 0, completed: 0 };
      }
      requestsByDate[date].total += 1;
      if (req.status?.toLowerCase() === "finished") {
        requestsByDate[date].completed += 1;
      }
    });

    return Object.keys(requestsByDate)
      .sort()
      .map((date) => {
        const completed = requestsByDate[date].completed;
        const total = requestsByDate[date].total;
        const rate = total > 0 ? (completed / total) * 100 : 0;

        return {
          date,
          successRate: parseFloat(rate.toFixed(1)),
          completed: completed,
          total: total,
          status:
            rate >= 90
              ? "Excellent"
              : rate >= 80
              ? "Good"
              : rate >= 70
              ? "Average"
              : "Needs Improvement",
        };
      });
  };

  const calculateHandlingTimeDistribution = (requests) => {
    const completedRequests = requests.filter(
      (req) =>
        req.status?.toLowerCase() === "finished" &&
        req.request_time &&
        (req.staff_finish_time || req.completed_time)
    );

    const handlingTimes = completedRequests.map((req) => {
      const completedTime = req.staff_finish_time || req.completed_time;
      const startTime = new Date(`${req.request_date} ${req.request_time}`);
      const endTime = new Date(`${req.request_date} ${completedTime}`);
      const minutes = Math.max(
        0,
        Math.round((endTime - startTime) / (1000 * 60))
      );
      return { minutes, id: req.request_id };
    });

   // Update the timeRanges colors in calculateHandlingTimeDistribution
   const timeRanges = [
    { 
      range: "0-5 min", 
      count: 0, 
      min: 0, 
      max: 5, 
      color: CHART_COLORS.accent.cyan, 
      value: 5 
    },
    { range: "5-15 min", 
      count: 0, 
      min: 5, 
      max: 15, 
      color: CHART_COLORS.accent.blue, 
      value: 15  },

    { range: "15-30 min", 
      count: 0, 
      min: 15, 
      max: 30, 
      color: CHART_COLORS.accent.indigo, 
      value: 30 },

      { range: "30-60 min", 
        count: 0, 
        min: 30, 
        max: 60, 
        color: CHART_COLORS.accent.purple, 
        value: 60 },
      
      { range: "1-2 hrs", 
        count: 0, 
        min: 60, 
        max: 120, 
        color: CHART_COLORS.accent.deepPurple, 
        value: 120 },
  
      { range: "2+ hrs", 
        count: 0, 
        min: 120, 
        max: Infinity, 
        color: CHART_COLORS.accent.pink, 
        value: 180 },
    ];
      // Count requests in each time range
      handlingTimes.forEach((item) => {
        const range = timeRanges.find(
          (r) => item.minutes >= r.min && item.minutes < r.max
        );
        if (range) range.count++;
      });
  
      // Calculate percentage for each range
      const total = handlingTimes.length;
      return timeRanges.map((range) => ({
        ...range,
        percentage: total > 0 ? ((range.count / total) * 100).toFixed(1) : 0,
      }));
    };
  
    // Calculate top departments with enhanced visualization
    const calculateTopDepartments = (requests) => {
      const deptCount = {};
      let totalRequests = 0;
  
      requests.forEach((req) => {
        if (!req.base_service_point_id) return;
  
        const dept = req.base_service_point_id;
        deptCount[dept] = (deptCount[dept] || 0) + 1;
        totalRequests++;
      });
  
      const result = Object.keys(deptCount)
        .map((dept, index) => ({ 
          name: dept, 
          count: deptCount[dept],
          percentage: (deptCount[dept] / totalRequests * 100).toFixed(1),
          color: CHART_COLORS.primary.translator[index % CHART_COLORS.primary.translator.length]
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
  
      // Add ranking for better visualization
      result.forEach((item, index) => {
        item.rank = index + 1;
      });
  
      return result;
    };
  
    // Calculate success rate data for the appropriate request type
    const successRateData = calculateSuccessRate(
      selectedDataType === "patient_escort"
        ? filteredRequests
        : filteredCoordRequests
    );
  
    // Calculate handling time distribution
    const handlingTimeData = calculateHandlingTimeDistribution(
      selectedDataType === "patient_escort"
        ? filteredRequests
        : filteredCoordRequests
    );
  
    // Calculate top departments
    const topDepartmentsData = calculateTopDepartments(
      selectedDataType === "patient_escort"
        ? filteredRequests
        : filteredCoordRequests
    );
  
    
    // ประเภทของ chart ที่จะแสดง
    if (selectedDataType === "patient_escort") {
      return (
        <div className="dashboard-charts grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
    
          {/* Department distribution for patient escorts */}
          {visibleCharts.departmentDistribution && (
            <ChartContainer title="Patient Escort Department Distribution">
              <div className="chart-with-info">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={filteredDepartmentDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name}: ${formatPercent(percent * 100)}`
                      }
                      outerRadius={110}
                      innerRadius={60}
                      paddingAngle={2}
                      dataKey="value"
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {filteredDepartmentDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            CHART_COLORS.accent[
                              Object.keys(CHART_COLORS.accent)[
                                index % Object.keys(CHART_COLORS.accent).length
                              ]
                            ]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name, props) => [
                        formatPercent(value * 100),
                        name,
                      ]}
                      contentStyle={{
                        borderRadius: "5px",
                        padding: "10px",
                        backgroundColor: "rgba(255, 255, 255, 0.95)",
                        boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                        border: "1px solid #ddd",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div
                  className="chart-timestamp"
                  style={{
                    textAlign: "right",
                    fontSize: "12px",
                    color: "#999",
                    padding: "5px 10px",
                  }}
                >
                  Data current as of {currentDateTime}
                </div>
              </div>
            </ChartContainer>
          )}
  
          {/* Top Departments - Improved */}
          {visibleCharts.topDepartments && (
            <ChartContainer title="Top Departments with Most Patient Escort Requests">
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={topDepartmentsData}
                  layout="vertical"
                  margin={{ top: 20, right: 30, left: 100, bottom: 20 }}
                >
                  <defs>
                    {topDepartmentsData.map((entry, index) => (
                      <linearGradient
                        id={`departmentBarColor${index}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                        key={`gradient-dept-${index}`}
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={0.9}
                        />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.6}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e0e0e0"
                    horizontal={true}
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#555", fontSize: 12 }}
                    tickFormatter={formatNumber}
                    label={{
                      value: "Number of Requests",
                      position: "insideBottom",
                      offset: -10,
                      style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                    }}
                  />
                  <YAxis
                    dataKey="name"
                    type="category"
                    width={100}
                    tick={{ fill: "#444", fontSize: 12 }}
                    tickFormatter={(value) => {
                      return value.length > 13
                        ? `${value.substring(0, 12)}...`
                        : value;
                    }}
                  />
                  <Tooltip
                    formatter={(value, name, props) => {
                      return [
                        `${formatNumber(value)} requests (${
                          props.payload.percentage
                        }%)`,
                        props.payload.name,
                      ];
                    }}
                    contentStyle={{
                      borderRadius: "5px",
                      padding: "10px",
                      backgroundColor: "rgba(255, 255, 255, 0.95)",
                      boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                      border: "1px solid #ddd",
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    wrapperStyle={{ paddingBottom: 10 }}
                  />
                  <Bar
                    dataKey="count"
                    name="Number of Requests"
                    radius={[0, 4, 4, 0]}
                  >
                    {topDepartmentsData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#departmentBarColor${index})`}
                        stroke={entry.color}
                        strokeWidth={1}
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="right"
                      style={{ fill: "#333", fontSize: "12px", fontWeight: 500 }}
                      formatter={formatNumber}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div
                className="chart-ranking"
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "10px",
                  fontSize: "13px",
                }}
              >
                <div style={{ color: "#666" }}>
                  <strong>Data Analysis:</strong>{" "}
                  {topDepartmentsData.length > 0
                    ? `${
                        topDepartmentsData[0].name
                      } has the highest number of requests (${formatNumber(
                        topDepartmentsData[0].count
                      )})`
                    : "No data available"}
                </div>
                <div style={{ color: "#999" }}>Updated: {currentDateTime}</div>
              </div>
            </ChartContainer>
          )}
  
  
          {/* Handling Time Distribution - Improved */}
          {visibleCharts.handlingTimeDistribution && (
            <ChartContainer title="Patient Escort Handling Time Distribution">
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart
                  data={handlingTimeData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
                >
                  <defs>
                    {handlingTimeData.map((entry, index) => (
                      <linearGradient
                        id={`gradient-${index}`}
                        key={`gradient-${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={entry.color}
                          stopOpacity={0.8} />
                        <stop
                          offset="100%"
                          stopColor={entry.color}
                          stopOpacity={0.3} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
                  <XAxis dataKey="range" tick={{ fill: "#555", fontSize: 12 }} />
                  <YAxis
                    yAxisId="left"
                    orientation="left"
                    tick={{ fill: "#555", fontSize: 12 }}
                    label={{
                      value: "Request Count",
                      angle: -90,
                      position: "insideLeft",
                      style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                    }} />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, 100]}
                    tick={{ fill: "#555", fontSize: 12 }}
                    label={{
                      value: "Percentage (%)",
                      angle: 90,
                      position: "insideRight",
                      style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                    }}  />
                  <Tooltip content={<HandlingTimeTooltip />} />
                  <Legend wrapperStyle={{ paddingTop: 15 }} />
  
                  {/* Bars for counts with gradient fill */}
                  {handlingTimeData.map((entry, index) => (
                    <Bar
                      key={`bar-${index}`}
                      dataKey="count"
                      name={entry.range}
                      fill={`url(#gradient-${index})`}
                      yAxisId="left"
                      barSize={25}
                      fillOpacity={0.9}
                      stroke={entry.color}
                      strokeWidth={1}
                      stackId="stack"
                      radius={[4, 4, 0, 0]}
                    >
                      <LabelList
                        dataKey="count"
                        position="top"
                        style={{
                          fontSize: "11px",
                          fill: "#333",
                          fontWeight: 500,
                        }}
                      />
                      {handlingTimeData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${index})`}
                        />
                      ))}
                    </Bar>
                  ))}
  
                  {/* Line for percentage */}
                  <Line
                    type="monotone"
                    dataKey="percentage"
                    name="Percentage"
                    stroke={CHART_COLORS.accent.purple}
                    yAxisId="right"
                    strokeWidth={2}
                    dot={{
                      stroke: CHART_COLORS.accent.purple,
                      fill: "white",
                      strokeWidth: 2,
                      r: 4,
                    }}
                    activeDot={{
                      r: 6,
                      stroke: CHART_COLORS.accent.purple,
                      strokeWidth: 2,
                    }} />
                </ComposedChart>
              </ResponsiveContainer>
              <div
                className="chart-caption"
                style={{
                  fontSize: "13px",
                  textAlign: "center",
                  color: "#666",
                  marginTop: "10px",
                  fontStyle: "italic",
                }}
              >
                Distribution of request handling times across different time
                ranges
              </div>
            </ChartContainer>
          )}
        </div>
      );
    }
  
    return (
      <div className="dashboard-charts grid grid-cols-1 md:grid-cols-2 gap-6 p-4">
      
        {/* Language distribution chart for Translators - improved */}
        {visibleCharts.languageDistribution && (
          <ChartContainer title="Language Distribution">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <defs>
                  {filteredLanguageDistribution.map((entry, index) => (
                    <linearGradient
                      id={`pieColor${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                      key={`gradient-lang-${index}`}
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          CHART_COLORS.primary.translator[
                            index % CHART_COLORS.primary.translator.length ] }
                        stopOpacity={0.8} />
                                         <stop
                      offset="100%"
                      stopColor={
                        CHART_COLORS.primary.translator[
                          index % CHART_COLORS.primary.translator.length ] }
                      stopOpacity={0.6} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={filteredLanguageDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => {
                  return percent > 0.05
                    ? `${name}: ${formatPercent(percent * 100)}`
                    : "";
                }}
                outerRadius={110}
                innerRadius={55}
                paddingAngle={2}
                fill="#8884d8"
                dataKey="value"
                stroke="#ffffff"
                strokeWidth={2}
              >
                {filteredLanguageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={`url(#pieColor${index})`} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name, props) => [
                  formatPercent(value * 100),
                  name, ]}
                contentStyle={{
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                  border: "1px solid #ddd",
                }} />
              <Legend layout="vertical" verticalAlign="middle" align="right" />
            </PieChart>
          </ResponsiveContainer>
          <div
            className="chart-timestamp"
            style={{
              textAlign: "right",
              fontSize: "12px",
              color: "#999",
              padding: "5px 0",
            }}
          >
            Data current as of {currentDateTime} • User: {currentUser}
          </div>
        </ChartContainer>
      )}

      {/* Request Locations chart - improved */}
      {visibleCharts.requestLocations && (
        <ChartContainer title="Translator Request Locations">
          <ResponsiveContainer width="100%" height={350}>
            <BarChart
              data={
                filteredCoordRequests.length > 0
                  ? Array.from(
                      new Set(
                        filteredCoordRequests.map(
                          (req) => req.base_service_point_id
                        )
                      )
                    )
                      .filter((dept) => dept)
                      .map((dept, index) => ({
                        name: dept,
                        requests: filteredCoordRequests.filter(
                          (req) => req.base_service_point_id === dept
                        ).length,
                        color: themeColors[index % themeColors.length],
                      }))
                      .sort((a, b) => b.requests - a.requests)
                  : []
              }
              margin={{ top: 20, right: 30, left: 20, bottom: 70 }}
            >
              <defs>
                {filteredCoordRequests.length > 0 &&
                  Array.from(
                    new Set(
                      filteredCoordRequests.map(
                        (req) => req.base_service_point_id
                      )
                    )
                  )
                    .filter((dept) => dept)
                    .map((dept, index) => (
                      <linearGradient
                        id={`locBarColor${index}`}
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                        key={`gradient-loc-${index}`}
                      >
                         <stop 
                    offset="0%" 
                    stopColor={CHART_COLORS.accent[Object.keys(CHART_COLORS.accent)[index % Object.keys(CHART_COLORS.accent).length]]} 
                    stopOpacity={0.8} 
                  />
                  <stop 
                    offset="100%" 
                    stopColor={CHART_COLORS.accent[Object.keys(CHART_COLORS.accent)[index % Object.keys(CHART_COLORS.accent).length]]} 
                    stopOpacity={0.4} 
                  />
                      </linearGradient>
                    ))}
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#e0e0e0" />
              <XAxis
                dataKey="name"
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: "#555", fontSize: 12 }}
                interval={0} />
              <YAxis
                tick={{ fill: "#555", fontSize: 12 }}
                label={{
                  value: "Number of Requests",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                }} />
              <Tooltip
                formatter={(value, name, props) => [
                  `${value} requests`,
                  props.payload.name,
                ]}
                contentStyle={{
                  borderRadius: "5px",
                  padding: "10px",
                  backgroundColor: "rgba(255, 255, 255, 0.95)",
                  boxShadow: "0 2px 5px rgba(0,0,0,0.15)",
                  border: "1px solid #ddd",
                }} />
              <Legend
                wrapperStyle={{ paddingTop: 10 }}
                verticalAlign="top"
                align="right" />
              <Bar
                dataKey="requests"
                name="Translator Requests"
                radius={[4, 4, 0, 0]}
              >
                {filteredCoordRequests.length > 0 &&
                  Array.from(
                    new Set(
                      filteredCoordRequests.map(
                        (req) => req.base_service_point_id
                      )
                    )
                  )
                    .filter((dept) => dept)
                    .map((dept, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#locBarColor${index})`}
                        stroke={themeColors[index % themeColors.length]}
                        strokeWidth={1} />
                    ))}
                <LabelList dataKey="requests" position="top" />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div
            className="chart-timestamp"
            style={{
              textAlign: "right",
              fontSize: "12px",
              color: "#999",
              padding: "5px 0",
            }}
          >
            Data current as of {currentDateTime} • User: {currentUser}
          </div>
        </ChartContainer>
      )}



      {/* Handling Time Distribution - improved */}
      {visibleCharts.handlingTimeDistribution && (
        <ChartContainer title="Translator Handling Time Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart
              data={handlingTimeData}
              margin={{ top: 20, right: 30, left: 20, bottom: 50 }}
            >
              <defs>
                {handlingTimeData.map((entry, index) => (
                  <linearGradient
                    id={`translator-gradient-${index}`}
                    key={`translator-gradient-${index}`}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="0%"
                      stopColor={entry.color}
                      stopOpacity={0.8}  />
                    <stop
                      offset="100%"
                      stopColor={entry.color}
                      stopOpacity={0.3} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
              <XAxis dataKey="range" tick={{ fill: "#555", fontSize: 12 }} />
              <YAxis
                yAxisId="left"
                orientation="left"
                tick={{ fill: "#555", fontSize: 12 }}
                label={{
                  value: "Request Count",
                  angle: -90,
                  position: "insideLeft",
                  style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                }} />
              <YAxis
                yAxisId="right"
                orientation="right"
                domain={[0, 100]}
                tick={{ fill: "#555", fontSize: 12 }}
                label={{
                  value: "Percentage (%)",
                  angle: 90,
                  position: "insideRight",
                  style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                }} />
              <Tooltip content={<HandlingTimeTooltip />} />
              <Legend wrapperStyle={{ paddingTop: 15 }} />

              {/* Bars for counts with gradient fill */}
              {handlingTimeData.map((entry, index) => (
                <Bar
                  key={`translator-bar-${index}`}
                  dataKey="count"
                  name={entry.range}
                  fill={`url(#translator-gradient-${index})`}
                  yAxisId="left"
                  barSize={25}
                  fillOpacity={0.9}
                  stroke={entry.color}
                  strokeWidth={1}
                  stackId="translator-stack"
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="count"
                    position="top"
                    style={{ fontSize: "11px", fill: "#333", fontWeight: 500 }} />
                  {handlingTimeData.map((entry, index) => (
                    <Cell
                      key={`translator-cell-${index}`}
                      fill={`url(#translator-gradient-${index})`} />
                  ))}
                </Bar>
              ))}
              {/* Line for percentage */}
              <Line
                type="monotone"
                dataKey="percentage"
                name="Percentage"
                stroke={CHART_COLORS.primary.translator[0]}
                yAxisId="right"
                strokeWidth={2}
                dot={{
                  stroke: CHART_COLORS.primary.translator[0],
                  fill: "white",
                  strokeWidth: 2,
                  r: 4,
                }}
                activeDot={{
                  r: 6,
                  stroke: CHART_COLORS.primary.translator[0],
                  strokeWidth: 2,
                }} />
            </ComposedChart>
          </ResponsiveContainer>
          <div
            className="chart-caption"
            style={{
              fontSize: "13px",
              textAlign: "center",
              color: "#666",
              marginTop: "10px",
              fontStyle: "italic",
            }}
          >
            Distribution of translation request handling times across different
            time ranges
          </div>
        </ChartContainer>
      )}
    </div>
  );
};

export default ChartSection;