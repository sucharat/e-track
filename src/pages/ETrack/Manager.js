import React, { useState, useEffect, useCallback } from "react";
import "./ETrack.css";
import "./Manager.css";
import "../../App.css";
import { url, getLocalData } from "../../helper/help";

// Import MUI components
import { Grid, Paper } from "@mui/material";

// Import custom components
import DashboardHeader from "./components/Manager/DashboardHeader";
import TypeSelector from "./components/Manager/TypeSelector";
import ControlsRow from "./components/Manager/ControlsRow";
import StatsDisplay from "./components/Manager/StatsDisplay";
import ChartSection from "./components/Manager/ChartSection";
import SummarySection from "./components/Manager/SummarySection";
import SystemStats from "./components/Manager/SystemStats";
import DashboardFooter from "./components/Manager/DashboardFooter";
import HeatMapCalendarContainer from "./components/Manager/HeatMapCalendarContainer";
import SuccessRateChart from "./components/Manager/SuccessRateChart";
import { CHART_COLORS } from "./components/Manager/ChartSection";
import RequestDistributionChart from "./components/Manager/RequestDistributionChart";

// Import utilities
import {
  processTimeBasedData,
  processStaffSummary,
  processEscortData,
  processDepartmentDistribution,
  processTranslatorSummary,
  calculateAverageResponseTime,
} from "./components/Manager/utils/dataProcessing";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884d8",
  "#82ca9d",
];
const currentUser = localStorage.getItem("fullName");
const getCurrentDateTime = () => {
  const now = new Date();
  return now.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).replace(',', '').replace(/\//g, '-').replace(' ', ' '); };

console.log("currentUser", currentUser);
console.log("getLocalData", getLocalData("fullName"));

const Manager = () => {
  const [selectedDataType, setSelectedDataType] = useState("patient_escort");
  const [dateRange, setDateRange] = useState({
    type: "custom",
    startDate: "",
    endDate: "",
  });

   const [currentDateTime, setCurrentDateTime] = useState(getCurrentDateTime());
  // Core state for the application
  const [loading, setLoading] = useState(false);

  const getCurrentDate = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Original data
  const [requests, setRequests] = useState([]);
  const [coordRequests, setCoordRequests] = useState([]);
  const [staffSummary, setStaffSummary] = useState([]);
  const [translatorSummary, setTranslatorSummary] = useState([]);

  // Filtered data
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [filteredCoordRequests, setFilteredCoordRequests] = useState([]);
  const [filteredStaffSummary, setFilteredStaffSummary] = useState([]);
  const [filteredTranslatorSummary, setFilteredTranslatorSummary] = useState(
    [] );

  // Stats data
  const [pendingEscortCount, setPendingEscortCount] = useState(0);
  const [completedEscortCount, setCompletedEscortCount] = useState(0);
  const [pendingCoordCount, setPendingCoordCount] = useState(0);
  const [completedCoordCount, setCompletedCoordCount] = useState(0);

  // Filtered stats
  const [filteredPendingEscortCount, setFilteredPendingEscortCount] =
    useState(0);
  const [filteredCompletedEscortCount, setFilteredCompletedEscortCount] =
    useState(0);
  const [filteredPendingCoordCount, setFilteredPendingCoordCount] = useState(0);
  const [filteredCompletedCoordCount, setFilteredCompletedCoordCount] =
    useState(0);

  // Time-based chart data
  const [escortHourlyData, setEscortHourlyData] = useState([]);
  const [translatorHourlyData, setTranslatorHourlyData] = useState([]);
  const [, setFilteredEscortHourlyData] = useState([]);
  const [, setFilteredTranslatorHourlyData] =
    useState([]);

  // Daily trend data
  const [escortDailyTrends, setEscortDailyTrends] = useState([]);
  const [translatorDailyTrends, setTranslatorDailyTrends] = useState([]);
  const [, setFilteredEscortDailyTrends] = useState(
    [] );
  const [, setFilteredTranslatorDailyTrends] =
    useState([]);

  // Daily hourly trend data
  const [translatorDailyHourlyTrends, setTranslatorDailyHourlyTrends] =
    useState([]);
  const [
    filteredTranslatorDailyHourlyTrends,
    setFilteredTranslatorDailyHourlyTrends,
  ] = useState([]);
  const [escortDailyHourlyTrends, setEscortDailyHourlyTrends] = useState([]);
  const [filteredEscortDailyHourlyTrends, setFilteredEscortDailyHourlyTrends] =
    useState([]);

  // Chart data state
  const [departmentDistribution, setDepartmentDistribution] = useState([]);
  const [filteredDepartmentDistribution, setFilteredDepartmentDistribution] =
    useState([]);
  const [languageDistribution, setLanguageDistribution] = useState([]);
  const [filteredLanguageDistribution, setFilteredLanguageDistribution] =
    useState([]);
  const [escorts, setEscorts] = useState([]);
  const [, setFilteredEscorts] = useState([]);

  const [visibleCharts, setVisibleCharts] = useState({
    dailyTrends: true,
    languageDistribution: true,
    requestLocations: true,
    departmentDistribution: true,
    completionRate: true,
    heatMapCalendar: true,
    successRate: true,
    topDepartments: true,
    handlingTimeScatter: true,
    requestDistribution: true,
    chartType: "line",  } );

  const dataTypeOptions = [
    { value: "patient_escort", label: "Patient Escort" },
    { value: "translator", label: "Translator/International Coordinator" },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(getCurrentDateTime());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

// Function to calculate success rate data
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

  const successRateData = calculateSuccessRate(
    selectedDataType === "patient_escort"
      ? filteredRequests
      : filteredCoordRequests
  );
  
  const handleDateRangeChange = (newDateRange) => {
    setDateRange(newDateRange);
    applyDateFilter(newDateRange);
  };

  const applyDateFilter = (range) => {
    if (!range.startDate || !range.endDate) {
      // Reset all filtered data to original data
      setFilteredRequests(requests);
      setFilteredCoordRequests(coordRequests);
      setFilteredStaffSummary(staffSummary);
      setFilteredTranslatorSummary(translatorSummary);
      setFilteredPendingEscortCount(pendingEscortCount);
      setFilteredCompletedEscortCount(completedEscortCount);
      setFilteredPendingCoordCount(pendingCoordCount);
      setFilteredCompletedCoordCount(completedCoordCount);
      setFilteredEscortHourlyData(escortHourlyData);
      setFilteredTranslatorHourlyData(translatorHourlyData);
      setFilteredEscortDailyTrends(escortDailyTrends);
      setFilteredTranslatorDailyTrends(translatorDailyTrends);
      setFilteredTranslatorDailyHourlyTrends(translatorDailyHourlyTrends);
      setFilteredDepartmentDistribution(departmentDistribution);
      setFilteredLanguageDistribution(languageDistribution);
      setFilteredEscorts(escorts);
      setFilteredEscortDailyHourlyTrends(escortDailyHourlyTrends);
      return; }
    // Filter date range logic implementation
    const startDate = new Date(range.startDate);
    const endDate = new Date(range.endDate);
    endDate.setHours(23, 59, 59);

    // Patient escort requests filtering
    const filteredEscortReqs = requests.filter((req) => {
      if (!req.request_date || !req.request_time) return false;
      const requestDateTime = new Date(
        `${req.request_date} ${req.request_time}` ) ;
      return requestDateTime >= startDate && requestDateTime <= endDate; } );
    setFilteredRequests(filteredEscortReqs);

    const pendingEscort = filteredEscortReqs.filter(
      (req) => req.status?.toLowerCase() === "pending"
    ).length;

    const completedEscort = filteredEscortReqs.filter(
      (req) => req.status?.toLowerCase() === "finished"
    ).length;

    setFilteredPendingEscortCount(pendingEscort);
    setFilteredCompletedEscortCount(completedEscort);

    // Coordinator requests filtering
    const filteredCoord = coordRequests.filter((req) => {
      if (!req.request_date || !req.request_time) return false;
      const requestDateTime = new Date(
        `${req.request_date} ${req.request_time}`
      );
      return requestDateTime >= startDate && requestDateTime <= endDate; } );
    setFilteredCoordRequests(filteredCoord);

    const pendingCoord = filteredCoord.filter(
      (req) => req.status?.toLowerCase() === "pending"
    ).length;

    const completedCoord = filteredCoord.filter(
      (req) => req.status?.toLowerCase() === "finished"
    ).length;

    setFilteredPendingCoordCount(pendingCoord);
    setFilteredCompletedCoordCount(completedCoord);

    // Staff summary filtering
    const filteredStaff = staffSummary.filter((staff) => {
      if (!staff.lastRequestTime) return false;
      const requestDate = new Date(staff.lastRequestTime);
      return requestDate >= startDate && requestDate <= endDate;
    });
    setFilteredStaffSummary(filteredStaff);

    // Translator summary filtering
    const filteredTranslator = translatorSummary.filter((translator) => {
      if (!translator.lastRequestTime) return false;
      const requestDate = new Date(translator.lastRequestTime);
      return requestDate >= startDate && requestDate <= endDate;
    });
    setFilteredTranslatorSummary(filteredTranslator);

    // Filter time-based data
    const filterHourlyData = (hourlyData) => {
      return hourlyData.filter((dataPoint) => {
        const pointDate = new Date(dataPoint.date);
        return pointDate >= startDate && pointDate <= endDate;
      });
    };

    setFilteredEscortHourlyData(filterHourlyData(escortHourlyData));
    setFilteredTranslatorHourlyData(filterHourlyData(translatorHourlyData));

    const filterDailyTrends = (trendsData) => {
      return trendsData.filter((dataPoint) => {
        const pointDate = new Date(dataPoint.date);
        return pointDate >= startDate && pointDate <= endDate;
      });
    };

    setFilteredEscortDailyTrends(filterDailyTrends(escortDailyTrends));
    setFilteredTranslatorDailyTrends(filterDailyTrends(translatorDailyTrends));
    setFilteredTranslatorDailyHourlyTrends(
      filterDailyTrends(translatorDailyHourlyTrends)
    );
    setFilteredEscortDailyHourlyTrends(
      filterDailyTrends(escortDailyHourlyTrends)
    );

    // Department distribution filtering
    const filteredDeptCount = {};
    filteredEscortReqs.forEach((req) => {
      if (req.base_service_point_id) {
        filteredDeptCount[req.base_service_point_id] =
          (filteredDeptCount[req.base_service_point_id] || 0) + 1; }
    });

    const filteredDeptData = Object.keys(filteredDeptCount).map((dept) => ({
      name: dept,
      value: filteredDeptCount[dept],
    }));

    setFilteredDepartmentDistribution(
      filteredDeptData.length > 0 ? filteredDeptData : []
    );

  const filteredLangCount = {};
    filteredCoord.forEach((req) => {
      if (req.language) {
        filteredLangCount[req.language] =
          (filteredLangCount[req.language] || 0) + 1;
      }
     });
    const filteredLangData = Object.keys(filteredLangCount).map((lang) => ({
      name: lang,
      value: filteredLangCount[lang],
     }));
    setFilteredLanguageDistribution(
      filteredLangData.length > 0 ? filteredLangData : []
    ); };
  const fetchRequests = async () => {
    setLoading(true);
    try {
      var token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetEtrackRequest?Type=patient_escort",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          }, }
      );

      const iStatusCode = response.status;
      if (iStatusCode === 200) {
        const result = await response.json();
        var resBody = Array.isArray(result) ? result : JSON.parse(result);
        setRequests(resBody);
        setFilteredRequests(resBody);

        const pending = resBody.filter(
          (req) => req.status?.toLowerCase() === "pending"
        ).length;

        const finished = resBody.filter(
          (req) => req.status?.toLowerCase() === "finished"
        ).length;

        setPendingEscortCount(pending);
        setCompletedEscortCount(finished);
        setFilteredPendingEscortCount(pending);
        setFilteredCompletedEscortCount(finished);

        // Process additional data
        processStaffSummary(resBody, setStaffSummary, setFilteredStaffSummary);
         const { hourlyData, dailyData, dailyHourlyData } =
          processTimeBasedData(resBody);
        setEscortHourlyData(hourlyData);
        setFilteredEscortHourlyData(hourlyData);
        setEscortDailyTrends(dailyData);
        setFilteredEscortDailyTrends(dailyData);
        setEscortDailyHourlyTrends(dailyHourlyData);
        setFilteredEscortDailyHourlyTrends(dailyHourlyData);

        processDepartmentDistribution(
          resBody,
          setDepartmentDistribution,
          setFilteredDepartmentDistribution
        );
        processEscortData(resBody, setEscorts, setFilteredEscorts);
      }
    } catch (error) {
      console.error("Error fetching patient escort requests:", error);
    } finally {
      setLoading(false);
    }
  };

   const fetchCoordRequestsData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetEtrackRequest?Type=translator",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
         const data = await response.json();
         const dataArray = Array.isArray(data)
          ? data
          : typeof data === "string"
          ? JSON.parse(data)
          : [];
         if (
          dataArray.length > 0 ||
          (typeof data === "object" && JSON.stringify(data).startsWith("["))
        ) {
          const itemsToProcess =
            dataArray.length > 0 ? dataArray : JSON.parse(JSON.stringify(data));
          const transformedData = itemsToProcess.map((item) => ({
            id: item.request_id,
            coordinatorName: item.staff_name || "Unknown",
            language: item.lang || "Unknown",
            extension: item.staff_tel || "*0000",
            department: item.detail || "Unknown",
            base_service_point_id: item.base_service_point_id || "Unknown",
            urgency: "Normal",
            status: item.status || "Pending",
            patient_hn: item.patient_hn,
            request_date: item.request_date,
            request_time: item.request_time,
            staffId: item.staff_id,
          }));

          setCoordRequests(transformedData);
          setFilteredCoordRequests(transformedData);

          const pending = transformedData.filter(
            (req) => req.status?.toLowerCase() === "pending" ).length;
          const finished = transformedData.filter(
            (req) => req.status?.toLowerCase() === "finished" ).length;

          setPendingCoordCount(pending);
          setCompletedCoordCount(finished);
          setFilteredPendingCoordCount(pending);
          setFilteredCompletedCoordCount(finished);

          processTranslatorSummary(
            transformedData,
            setTranslatorSummary,
            setFilteredTranslatorSummary,
            setLanguageDistribution,
            setFilteredLanguageDistribution
          );

          const { hourlyData, dailyData, dailyHourlyData } =
            processTimeBasedData(transformedData);
          setTranslatorHourlyData(hourlyData);
          setFilteredTranslatorHourlyData(hourlyData);
          setTranslatorDailyTrends(dailyData);
          setFilteredTranslatorDailyTrends(dailyData);
          setTranslatorDailyHourlyTrends(dailyHourlyData);
          setFilteredTranslatorDailyHourlyTrends(dailyHourlyData);
        } else {
          console.error("Could not process API response as an array:", data); }
      } else {
        console.error(
          "Failed to fetch requests data. Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching requests data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    fetchCoordRequestsData();
  }, [fetchCoordRequestsData]);

  const clearDateFilter = () => {
    setDateRange({
      type: "custom",
      startDate: "",
      endDate: "",
    });

    setFilteredRequests(requests);
    setFilteredCoordRequests(coordRequests);
    setFilteredStaffSummary(staffSummary);
    setFilteredTranslatorSummary(translatorSummary);
    setFilteredPendingEscortCount(pendingEscortCount);
    setFilteredCompletedEscortCount(completedEscortCount);
    setFilteredPendingCoordCount(pendingCoordCount);
    setFilteredCompletedCoordCount(completedCoordCount);
    setFilteredEscortHourlyData(escortHourlyData);
    setFilteredTranslatorHourlyData(translatorHourlyData);
    setFilteredEscortDailyTrends(escortDailyTrends);
    setFilteredTranslatorDailyTrends(translatorDailyTrends);
    setFilteredTranslatorDailyHourlyTrends(translatorDailyHourlyTrends);
    setFilteredDepartmentDistribution(departmentDistribution);
    setFilteredLanguageDistribution(languageDistribution);
    setFilteredEscorts(escorts);
    setFilteredEscortDailyHourlyTrends(escortDailyHourlyTrends);
  };

  const chartOptions =
  selectedDataType === "patient_escort"
    ? [
        { value: "heatMapCalendar", label: "Activity Calendar (Heat Map)" },
        // { value: "dailyTrends", label: "Daily Trends Chart" },
        { value: "departmentDistribution", label: "Department Distribution Chart" },
        { value: "completionRate", label: "Completion Rate Chart" },
        // { value: "successRate", label: "Success Rate Chart" },
        { value: "topDepartments", label: "Top Departments Chart" },
        { value: "requestDistribution", label: "Request Distribution Chart" },
      ]
    : [
        { value: "heatMapCalendar", label: "Activity Calendar (Heat Map)" },
        // { value: "dailyTrends", label: "Daily Trends Chart" },
        { value: "languageDistribution", label: "Language Distribution Chart" },
        { value: "requestLocations", label: "Request Locations Chart" },
        { value: "completionRate", label: "Completion Rate Chart" },
        // { value: "successRate", label: "Success Rate Chart" },
        { value: "topDepartments", label: "Top Departments Chart" },
        { value: "requestDistribution", label: "Request Distribution Chart" },
      ];

  return (
    <div className="manager-container">
      <DashboardHeader username={currentUser} dateTime={currentDateTime} />

      <TypeSelector
        options={dataTypeOptions}
        value={selectedDataType}
        onChange={setSelectedDataType} />
        
      <ControlsRow
        dateRange={dateRange}
        onDateChange={handleDateRangeChange}
        chartOptions={chartOptions}
        visibleCharts={visibleCharts}
        setVisibleCharts={setVisibleCharts}/>

    <div className="dashboard-section-title">
        <h2>
          {selectedDataType === "patient_escort"
            ? "Patient Escort Management"
            : "International Coordinator Management"}
        </h2>
        {dateRange.startDate && dateRange.endDate && (
          <div className="filter-badge">
            Filtered by date: {dateRange.startDate} to {dateRange.endDate}
          </div> ) }
      </div>

      <Paper elevation={3} className="stats-container">
        <StatsDisplay
          selectedDataType={selectedDataType}
          filteredRequests={filteredRequests}
          filteredPendingEscortCount={filteredPendingEscortCount}
          filteredCompletedEscortCount={filteredCompletedEscortCount}
          filteredCoordRequests={filteredCoordRequests}
          filteredPendingCoordCount={filteredPendingCoordCount}
          filteredCompletedCoordCount={filteredCompletedCoordCount}  />
      </Paper>

      {/* Add HeatMap Calendar as a standalone component */}
      {visibleCharts.heatMapCalendar && (
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <HeatMapCalendarContainer
              title={`${
                selectedDataType === "patient_escort"
                  ? "Patient Escort"
                  : "Translator"
              } Activity Calendar`}
              data={
                selectedDataType === "patient_escort"
                  ? filteredRequests
                  : filteredCoordRequests
              }
              startDate={
                dateRange.startDate
                  ? new Date(dateRange.startDate)
                  : new Date(
                      new Date().setFullYear(new Date().getFullYear() - 1)
                    ) }
              endDate={
                dateRange.endDate ? new Date(dateRange.endDate) : new Date() }
              currentUser={currentUser}
              currentDateTime={currentDateTime}
              selectedDataType={selectedDataType} />
          </Grid>
        </Grid>
      )}

      <Grid container spacing={3} className="charts-grid">
        <Grid item xs={12}>
          <ChartSection
            selectedDataType={selectedDataType}
            visibleCharts={visibleCharts}
            filteredEscortDailyHourlyTrends={filteredEscortDailyHourlyTrends}
            filteredTranslatorDailyHourlyTrends={ filteredTranslatorDailyHourlyTrends }
            filteredDepartmentDistribution={filteredDepartmentDistribution}
            filteredLanguageDistribution={filteredLanguageDistribution}
            filteredCoordRequests={filteredCoordRequests}
            filteredRequests={filteredRequests}
            dateRange={dateRange}
            COLORS={COLORS}
            currentUser={currentUser}
            currentDateTime={currentDateTime} />
        </Grid>
      </Grid>

      {visibleCharts.requestDistribution && (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <RequestDistributionChart
        title={`${
          selectedDataType === "patient_escort"
            ? "Patient Escort"
            : "Translator"
        } Request Distribution Analysis`}
        data={
          selectedDataType === "patient_escort"
            ? filteredRequests
            : filteredCoordRequests }
        selectedDataType={selectedDataType}
        currentUser={currentUser}
        currentDateTime={currentDateTime}
      />
    </Grid>
  </Grid>
)}

{visibleCharts.successRate && (
  <Grid container spacing={3}>
    <Grid item xs={12}>
      <SuccessRateChart
        title={`${
          selectedDataType === "patient_escort"
            ? "Patient Escort"
            : "Translator"
        } Success Rate`}
        data={successRateData}
        chartColors={CHART_COLORS}  
        currentUser={currentUser}
        currentDateTime={currentDateTime}
        selectedDataType={selectedDataType}
      />
    </Grid>
  </Grid>
)}
      <SummarySection
        selectedDataType={selectedDataType}
        visibleCharts={visibleCharts}
        filteredStaffSummary={filteredStaffSummary}
        filteredTranslatorSummary={filteredTranslatorSummary}
        dateRange={dateRange}
        clearDateFilter={clearDateFilter}
        loading={loading}
        currentDateTime={currentDateTime}
        COLORS={COLORS} />

      <Paper elevation={3} className="dashboard-section">
        <SystemStats
          filteredRequests={filteredRequests}
          filteredCoordRequests={filteredCoordRequests}
          filteredPendingEscortCount={filteredPendingEscortCount}
          filteredCompletedEscortCount={filteredCompletedEscortCount}
          filteredPendingCoordCount={filteredPendingCoordCount}
          filteredCompletedCoordCount={filteredCompletedCoordCount}
          filteredStaffSummary={filteredStaffSummary}
          filteredTranslatorSummary={filteredTranslatorSummary}
          calculateAverageResponseTime={calculateAverageResponseTime} />
      </Paper>

      <DashboardFooter username={currentUser} />
    </div>
  );
};

export default Manager;
