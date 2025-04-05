import React, { useState } from "react";
import {
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList,
  ComposedChart,
  PieChart,
  Pie,
  Sector,
  AreaChart,
  Area,
} from "recharts";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Chip,
  Avatar,
  Grid,
  Divider,
  Paper,
} from "@mui/material";
import SummaryTable from "../SummaryTable";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import PersonIcon from "@mui/icons-material/Person";
import PieChartIcon from "@mui/icons-material/PieChart";
import StackedBarChartIcon from "@mui/icons-material/StackedBarChart";
import EqualizerIcon from "@mui/icons-material/Equalizer";
import { CHART_COLORS } from "./ChartSection";

// Constant for current date/time and user - updated as per your request
const CURRENT_DATETIME = "2025-03-20 17:40:59";
const CURRENT_USER = "test";

// Custom pastel green color palette for pie chart
const PASTEL_GREEN_COLORS = [
  "#8ed1b7", // Light mint green
  "#6bbd99", // Medium mint green
  "#4da87e", // Fresh green
  "#b0e3cc", // Pale mint
  "#d0f0c0", // Tea green
  "#98e2c6", // Seafoam green
  "#7dcfa7", // Pastel jade
  "#a5d6a7", // Light pastel green
  "#c5e1a5", // Pale lime green
  "#87ceac", // Soft pastel green
  "#b8e0d2", // Faded sage
  "#5fb49c", // Pastel teal green
  "#9ed9b5", // Soft mint
  "#77c19a", // Subdued green
  "#aeddbd", // Frosted green
];

// Custom tooltip for staff performance with no external references
const StaffPerformanceTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Calculate completion rate inside the component to avoid external references
    const completedValue =
      payload.find((p) => p.dataKey === "completed")?.value || 0;
    const pendingValue =
      payload.find((p) => p.dataKey === "pending")?.value || 0;
    const totalValue = completedValue + pendingValue;

    const completionRate =
      totalValue > 0 ? ((completedValue / totalValue) * 100).toFixed(1) : "0.0";

    return (
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderRadius: "8px",
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          maxWidth: "250px",
        }}
      >
        <Typography
          variant="subtitle2"
          sx={{ fontWeight: 600, mb: 1, color: "#333" }}
        >
          {label || "N/A"}
        </Typography>

        <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
          <Avatar
            sx={{
              width: 24,
              height: 24,
              fontSize: "12px",
              mr: 1,
              bgcolor: "#e0e0e0",
              color: "#333",
            }}
          >
            {(label || "N/A").charAt(0).toUpperCase()}
          </Avatar>
          <Typography variant="body2" sx={{ color: "#555" }}>
            Staff Member
          </Typography>
        </Box>

        <Divider sx={{ my: 1 }} />

        {payload.map((entry, index) => (
          <Box
            key={`tooltip-item-${index}`}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 0.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center" }}>
              <Box
                sx={{
                  width: 12,
                  height: 12,
                  mr: 1,
                  borderRadius: "2px",
                  backgroundColor: entry.color,
                }}
              />
              <Typography variant="caption" sx={{ color: "#555" }}>
                {entry.name || "Unknown"}:
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ fontWeight: 500, color: "#333" }}>
              {entry.value || 0}
            </Typography>
          </Box>
        ))}

        <Divider sx={{ my: 1 }} />

        <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1 }}>
          <Typography variant="caption" sx={{ color: "#555", fontWeight: 500 }}>
            Completion Rate:
          </Typography>
          <Chip
            size="small"
            label={`${completionRate}%`}
            color={parseFloat(completionRate) > 80 ? "success" : "primary"}
            variant="outlined"
            sx={{ height: 20, fontSize: "0.7rem" }}
          />
        </Box>
      </Paper>
    );
  }
  return null;
};

// Custom active shape for PieChart - updated with pastel green colors
const renderActiveShape = (props) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    percent,
    value,
  } = props;

  return (
    <g>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 5}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
        strokeWidth={2}
        stroke="#4da87e"
        opacity={0.9}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 7}
        outerRadius={outerRadius + 10}
        fill="#8ed1b7"
        opacity={0.6}
      />
      <text
        x={cx}
        y={cy - 15}
        textAnchor="middle"
        fill="#333"
        style={{ fontSize: 14, fontWeight: 600 }}
      >
        {payload.name}
      </text>
      <text
        x={cx}
        y={cy + 10}
        textAnchor="middle"
        fill="#666"
        style={{ fontSize: 12 }}
      >
        {`${value} requests`}
      </text>
      <text
        x={cx}
        y={cy + 30}
        textAnchor="middle"
        fill="#4da87e"
        style={{ fontSize: 12, fontWeight: 500 }}
      >
        {`${(percent * 100).toFixed(1)}%`}
      </text>
    </g>
  );
};

const SummarySection = ({
  selectedDataType,
  filteredStaffSummary,
  filteredTranslatorSummary,
  dateRange,
  clearDateFilter,
  loading,
}) => {
  const [chartView, setChartView] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0); 

  // Ensure we have arrays even if props are undefined
  const staffSummaryData = Array.isArray(filteredStaffSummary)
    ? filteredStaffSummary
    : [];
  const translatorSummaryData = Array.isArray(filteredTranslatorSummary)
    ? filteredTranslatorSummary
    : [];

  // Process staff data for better visualization
  const processStaffData = (staffData) => {
    if (!Array.isArray(staffData) || staffData.length === 0) {
      return [];
    }

    return staffData
      .map((staff) => {
        if (!staff) return null;

        // Safely extract values with fallbacks
        const staffName = staff.staffName || "Unknown";
        const finishedRequests = parseInt(staff.finishedRequests) || 0;
        const pendingRequests = parseInt(staff.pendingRequests) || 0;
        const total = finishedRequests + pendingRequests;
        const completionRate = total > 0 ? (finishedRequests / total) * 100 : 0;

        return {
          name: staffName.split(" ")[0],
          fullName: staffName,
          completed: finishedRequests,
          pending: pendingRequests,
          total: total,
          completionRate: completionRate,
          languages: staff.languages ? staff.languages.split(",").length : 0,
          lastActive: staff.lastRequestTime
            ? new Date(staff.lastRequestTime).toLocaleDateString()
            : "N/A",
          value: total,
          efficiency: completionRate,
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);
  };

  const staffData = processStaffData(
    selectedDataType === "patient_escort"
      ? staffSummaryData
      : translatorSummaryData
  );

  // Create a default top performer object
  const defaultTopPerformer = {
    name: "N/A",
    fullName: "No Data Available",
    completed: 0,
    pending: 0,
    total: 0,
    completionRate: 0,
    languages: 0,
    lastActive: "N/A",
  };

  // Find top performer safely
  const topPerformer =
    staffData.length > 0
      ? staffData.reduce((max, staff) => {
          if (!max || !staff) return staff || max;
          return max.completed > staff.completed ? max : staff;
        }, null) || defaultTopPerformer
      : defaultTopPerformer;

  // Calculate completion percentage safely
  const totalCompleted = staffData.reduce(
    (sum, staff) => sum + (staff?.completed || 0),
    0
  );
  const totalRequests = staffData.reduce(
    (sum, staff) => sum + (staff?.total || 0),
    0
  );
  const completionPercentage =
    totalRequests > 0
      ? ((totalCompleted / totalRequests) * 100).toFixed(1)
      : "0.0";

  // Get colors based on data type
  const accentColors = {
    completed: selectedDataType === "patient_escort" ? "#4da87e" : "#4da87e",
    pending: "#b0e3cc",
    languages: "#8ed1b7",
  };

  const hasData = staffData.length > 0;

  // Generate unique IDs for gradients
  const completedGradientId = `completedFill-${selectedDataType}`;
  const pendingGradientId = `pendingFill-${selectedDataType}`;
  const areaGradientId = `areaGradient-${selectedDataType}`;

  // Handle pie chart sector click
  const onPieEnter = (_, index) => {
    setActiveIndex(index);
  };

  const newLocal = (
    <LabelList
      dataKey="name"
      position="outside"
      style={{
        fontSize: "11px",
        fill: "#555",
        stroke: "#000",
        strokeWidth: 0.5,
      }}
      offset={20}
    />
  );

  const renderCustomLabel = (props) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, value, name, percent } =
      props;

    // Don't render label if value is 0
    if (value === 0) return null;

    // Calculate label position with increased distance for better spacing
    const RADIAN = Math.PI / 180;
    const radius = outerRadius + 35;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    // Calculate label anchor based on position
    const textAnchor = x > cx ? "start" : "end";

    return (
      <g>
        {/* Render connecting line */}
        <path
          d={`M ${cx + (outerRadius + 5) * Math.cos(-midAngle * RADIAN)},
               ${cy + (outerRadius + 5) * Math.sin(-midAngle * RADIAN)}
               L ${x},${y}`}
          stroke="#999"
          strokeWidth="1"
          fill="none"
        />
        {/* Render text with background */}
        <text
          x={x}
          y={y}
          textAnchor={textAnchor}
          dominantBaseline="middle"
          style={{
            fontSize: "11px",
            fill: "#555",
            fontWeight: "500",
          }}
        >
          {`${name} (${(percent * 100).toFixed(1)}%)`}
        </text>
      </g>
    );
  };

  return (
    <div className="dashboard-section">
      {/* Modern Staff Performance Chart */}
      <Paper
        elevation={3}
        sx={{
          p: 3,
          borderRadius: "12px",
          mb: 4,
          background: "linear-gradient(to bottom, #ffffff, #fafafa)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            justifyContent: "space-between",
            alignItems: { xs: "start", md: "center" },
            mb: 2,
          }}
        >
          <Box>
            <Typography
              variant="h6"
              component="h2"
              sx={{
                fontWeight: 700,
                color: "#333",
                borderBottom: `3px solid ${accentColors.completed}`,
                paddingBottom: "6px",
                display: "inline-block",
              }}
            >
              {selectedDataType === "patient_escort"
                ? "Patient Escort Staff Performance"
                : "Translator Staff Performance"}
            </Typography>

            <Typography variant="body2" sx={{ color: "#666", mt: 1 }}>
              Visualizing staff performance metrics and completion rates
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              gap: 2,
              mt: { xs: 2, md: 0 },
              flexWrap: "wrap",
            }}
          >
            {hasData && (
              <>
                <Tabs
                  value={chartView}
                  onChange={(e, newValue) => setChartView(newValue)}
                  sx={{ minHeight: "36px" }}
                >
                  <Tab
                    icon={<StackedBarChartIcon sx={{ fontSize: "1.1rem" }} />}
                    label="Bar"
                    sx={{
                      minHeight: "36px",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Tab
                    icon={<PieChartIcon sx={{ fontSize: "1.1rem" }} />}
                    label="Pie"
                    sx={{
                      minHeight: "36px",
                      fontSize: "0.875rem",
                    }}
                  />
                  <Tab
                    icon={<EqualizerIcon sx={{ fontSize: "1.1rem" }} />}
                    label="Area"
                    sx={{
                      minHeight: "36px",
                      fontSize: "0.875rem",
                    }}
                  />
                </Tabs>

                <Chip
                  icon={
                    <EmojiEventsIcon sx={{ fontSize: "1rem !important" }} />
                  }
                  label={`Top: ${topPerformer.name}`}
                  size="small"
                  sx={{
                    backgroundColor: `${accentColors.completed}15`,
                    color: accentColors.completed,
                    fontWeight: 500,
                    border: `1px solid ${accentColors.completed}30`,
                  }}
                />

                <Chip
                  icon={<TrendingUpIcon sx={{ fontSize: "1rem !important" }} />}
                  label={`${completionPercentage}% Complete`}
                  size="small"
                  sx={{
                    backgroundColor:
                      parseFloat(completionPercentage) > 80
                        ? "#e8f5e9"
                        : parseFloat(completionPercentage) > 50
                        ? "#fff8e1"
                        : "#ffebee",
                    color:
                      parseFloat(completionPercentage) > 80
                        ? "#2e7d32"
                        : parseFloat(completionPercentage) > 50
                        ? "#f57c00"
                        : "#c62828",
                    fontWeight: 500,
                    border: `1px solid ${
                      parseFloat(completionPercentage) > 80
                        ? "#a5d6a7"
                        : parseFloat(completionPercentage) > 50
                        ? "#ffe082"
                        : "#ef9a9a"
                    }`,
                  }}
                />
              </>
            )}
          </Box>
        </Box>

        <Box
          sx={{
            height: 400,
            mt: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {!hasData ? (
            <Typography
              variant="body1"
              sx={{ color: "#666", fontStyle: "italic" }}
            >
              No staff performance data available for the selected period
            </Typography>
          ) : chartView === 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={staffData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  <linearGradient
                    id={completedGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={accentColors.completed}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={accentColors.completed}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                  <linearGradient
                    id={pendingGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={accentColors.pending}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={accentColors.pending}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#e0e0e0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ angle: -45, fill: "#555", fontSize: 12 }}
                  height={60}
                  textAnchor="end"
                  axisLine={{ stroke: "#ddd" }}
                  tickLine={{ stroke: "#ddd" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#555", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Request Count",
                    angle: -90,
                    position: "insideLeft",
                    style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                  }}
                />

                {selectedDataType === "translator" && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    domain={[0, "dataMax + 1"]}
                    tick={{ fill: "#555", fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                    label={{
                      value: "Languages",
                      angle: 90,
                      position: "insideRight",
                      style: {
                        textAnchor: "middle",
                        fill: "#666",
                        fontSize: 13,
                      },
                    }}
                  />
                )}

                <Tooltip content={<StaffPerformanceTooltip />} />
                <Legend wrapperStyle={{ marginTop: 10 }} />

                <Bar
                  dataKey="completed"
                  name="Completed Requests"
                  stackId="a"
                  fill={`url(#${completedGradientId})`}
                  stroke={accentColors.completed}
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  yAxisId="left"
                  animationBegin={0}
                  animationDuration={1500}
                  animationEasing="ease-out"
                >
                  {staffData.map((entry, index) => (
                    <Cell
                      key={`completed-${index}`}
                      fill={
                        entry && entry.name === topPerformer.name
                          ? accentColors.completed
                          : `url(#${completedGradientId})`
                      }
                      stroke={
                        entry && entry.name === topPerformer.name
                          ? accentColors.completed
                          : accentColors.completed
                      }
                      strokeWidth={
                        entry && entry.name === topPerformer.name ? 2 : 1
                      }
                    />
                  ))}
                </Bar>

                <Bar
                  dataKey="pending"
                  name="Pending Requests"
                  stackId="a"
                  fill={`url(#${pendingGradientId})`}
                  stroke={accentColors.pending}
                  strokeWidth={1}
                  radius={[4, 4, 0, 0]}
                  yAxisId="left"
                  animationBegin={300}
                  animationDuration={1500}
                  animationEasing="ease-out"
                />
              
                {selectedDataType === "translator" && (
                  <Line
                    dataKey="languages"
                    name="Languages"
                    type="monotone"
                    stroke={accentColors.languages}
                    strokeWidth={2}
                    yAxisId="right"
                    dot={{
                      stroke: accentColors.languages,
                      strokeWidth: 2,
                      r: 4,
                      fill: "#fff",
                    }}
                    activeDot={{
                      r: 6,
                      stroke: accentColors.languages,
                      strokeWidth: 2,
                    }}
                    animationDuration={2000}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          ) : chartView === 1 ? (
            // pie chart
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <defs>
                  {staffData.map((entry, index) => (
                    <linearGradient
                      id={`pieGradient${index}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                      key={`gradient-${index}`}
                    >
                      <stop
                        offset="0%"
                        stopColor={
                          PASTEL_GREEN_COLORS[
                            index % PASTEL_GREEN_COLORS.length
                          ]
                        }
                        stopOpacity={0.9}
                      />
                      <stop
                        offset="95%"
                        stopColor={
                          PASTEL_GREEN_COLORS[
                            index % PASTEL_GREEN_COLORS.length
                          ]
                        }
                        stopOpacity={0.7}
                      />
                    </linearGradient>
                  ))}
                </defs>
                <Pie
                  activeIndex={activeIndex}
                  activeShape={renderActiveShape}
                  data={staffData.filter((item) => item.completed > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  dataKey="completed"
                  onMouseEnter={onPieEnter}
                  paddingAngle={3}
                  animationBegin={0}
                  animationDuration={1800}
                  animationEasing="ease-out"
                  label={renderCustomLabel}
                  labelLine={false}
                >
                  {staffData
                    .filter((item) => item.completed > 0)
                    .map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={`url(#pieGradient${index})`}
                        stroke={
                          PASTEL_GREEN_COLORS[
                            index % PASTEL_GREEN_COLORS.length
                          ]
                        }
                        strokeWidth={entry.name === topPerformer.name ? 2 : 1}
                      />
                    ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, props) => {
                    if (name === "completed") {
                      return [
                        `${value} requests completed`,
                        props.payload.name,
                      ];
                    }
                    return [value, name];
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    padding: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 2px 8px rgba(236, 109, 109, 0.1)",
                    border: "none",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            // Modern area chart with pastel green colors
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={staffData}
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <defs>
                  <linearGradient
                    id={areaGradientId}
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor={accentColors.completed}
                      stopOpacity={0.8}
                    />
                    <stop
                      offset="95%"
                      stopColor={accentColors.completed}
                      stopOpacity={0.1}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f0f0f0"
                />
                <XAxis
                  dataKey="name"
                  tick={{ angle: -45, fill: "#555", fontSize: 12 }}
                  height={60}
                  textAnchor="end"
                  axisLine={{ stroke: "#ddd" }}
                  tickLine={{ stroke: "#ddd" }}
                />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: "#555", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[0, 100]}
                  tick={{ fill: "#555", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  label={{
                    value: "Completion Rate (%)",
                    angle: 90,
                    position: "insideRight",
                    style: { textAnchor: "middle", fill: "#666", fontSize: 13 },
                  }}
                />
                <Tooltip
                  formatter={(value, name) => {
                    if (name === "total") {
                      return [`${value} requests`, "Total Requests"];
                    }
                    if (name === "completionRate") {
                      return [`${value.toFixed(1)}%`, "Completion Rate"];
                    }
                    return [value, name];
                  }}
                  contentStyle={{
                    borderRadius: "8px",
                    padding: "12px",
                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
                    border: "none",
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Requests"
                  stroke={accentColors.completed}
                  fill={`url(#${areaGradientId})`}
                  yAxisId="left"
                  activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                  animationDuration={2000}
                />
                <Line
                  type="monotone"
                  dataKey="completionRate"
                  name="Completion Rate"
                  stroke="#6bbd99"
                  strokeWidth={2}
                  yAxisId="right"
                  dot={{ fill: "#fff", strokeWidth: 2 }}
                  activeDot={{ r: 6, strokeWidth: 2 }}
                  animationBegin={300}
                  animationDuration={1800}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </Box>

        {/* Performance metrics summary */}
        {hasData && (
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #eee",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.07)",
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#666", mb: 1 }}>
                    Top Performer
                  </Typography>

                  <Box sx={{ display: "flex", alignItems: "center" }}>
                    <Avatar
                      sx={{
                        bgcolor: accentColors.completed,
                        width: 36,
                        height: 36,
                        mr: 1.5,
                      }}
                    >
                      <PersonIcon />
                    </Avatar>

                    <Box>
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 600, color: "#333" }}
                      >
                        {topPerformer.name}
                      </Typography>
                      <Typography variant="body2" sx={{ color: "#666" }}>
                        {topPerformer.completed} completed requests
                      </Typography>
                    </Box>
                  </Box>

                  {topPerformer.completionRate > 0 && (
                    <Box
                      sx={{
                        mt: 1,
                        width: "100%",
                        height: "5px",
                        backgroundColor: "#e0e0e0",
                        borderRadius: "10px",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${topPerformer.completionRate}%`,
                          height: "100%",
                          backgroundColor: accentColors.completed,
                        }}
                      />
                    </Box>
                  )}
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #eee",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.07)",
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#666", mb: 1 }}>
                    Team Performance
                  </Typography>

                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color:
                        parseFloat(completionPercentage) > 80
                          ? "#2e7d32"
                          : parseFloat(completionPercentage) > 50
                          ? "#f57c00"
                          : "#c62828",
                    }}
                  >
                    {completionPercentage}%
                  </Typography>

                  <Typography variant="body2" sx={{ color: "#666", mb: 1 }}>
                    Overall completion rate
                  </Typography>
                  
                  <Box
                    sx={{
                      mt: 1,
                      width: "100%",
                      height: "5px",
                      backgroundColor: "#e0e0e0",
                      borderRadius: "10px",
                      overflow: "hidden",
                    }}
                  >
                    <Box
                      sx={{
                        width: `${completionPercentage}%`,
                        height: "100%",
                        backgroundColor:
                          parseFloat(completionPercentage) > 80
                            ? "#4da87e"
                            : parseFloat(completionPercentage) > 50
                            ? accentColors.pending
                            : CHART_COLORS.accent.orange,
                      }}
                    />
                  </Box>
                </Paper>
              </Grid>

              <Grid item xs={12} md={4}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    borderRadius: "8px",
                    backgroundColor: "#f9f9f9",
                    border: "1px solid #eee",
                    transition: "transform 0.2s, box-shadow 0.2s",
                    "&:hover": {
                      transform: "translateY(-2px)",
                      boxShadow: "0 4px 10px rgba(0,0,0,0.07)",
                    },
                  }}
                >
                  <Typography variant="subtitle2" sx={{ color: "#666", mb: 1 }}>
                    Request Summary
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Total Requests:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: "#333" }}
                    >
                      {totalRequests}
                    </Typography>
                  </Box>

                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Completed:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: accentColors.completed }}
                    >
                      {totalCompleted}
                    </Typography>
                  </Box>

                  <Box
                    sx={{ display: "flex", justifyContent: "space-between" }}
                  >
                    <Typography variant="body2" sx={{ color: "#666" }}>
                      Pending:
                    </Typography>
                    <Typography
                      variant="body1"
                      sx={{ fontWeight: 600, color: accentColors.pending }}
                    >
                      {totalRequests - totalCompleted}
                    </Typography>
                  </Box>
                </Paper>
              </Grid>
            </Grid>

            <Box
              sx={{
                mt: 2,
                textAlign: "right",
                fontSize: "0.75rem",
                color: "#999",
              }}
            >
              Current as of {CURRENT_DATETIME} • User: {CURRENT_USER}
            </Box>
          </Box>
        )}
      </Paper>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h3 className="panel-title">
            {selectedDataType === "patient_escort"
              ? "Patient Escort Staff Summary"
              : "Translator Staff Summary"}
          </h3>
          <div className="filter-status">
            {dateRange.startDate && dateRange.endDate && (
              <div className="current-filter">
                Showing data from {dateRange.startDate} to {dateRange.endDate}
                <button className="clear-filter-btn" onClick={clearDateFilter}>
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>

        <SummaryTable
          tableType={
            selectedDataType === "patient_escort" ? "escort" : "translator"
          }
          data={
            selectedDataType === "patient_escort"
              ? filteredStaffSummary
              : filteredTranslatorSummary
          }
          loading={loading}
        />
        <div className="data-timestamp">
          Last updated: {CURRENT_DATETIME} • Generated by {CURRENT_USER}
        </div>
      </div>

    </div>
  );
};

export default SummarySection;