import React, { useState, useEffect } from "react";
import CalendarHeatmap from "react-calendar-heatmap";
import { Tooltip as ReactTooltip } from "react-tooltip";
import "react-calendar-heatmap/dist/styles.css";
import "react-tooltip/dist/react-tooltip.css";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Tabs,
  Tab,
  Box,
  Divider,
  Chip,
  Badge,
  Paper,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PersonIcon from "@mui/icons-material/Person";
import TranslateIcon from "@mui/icons-material/Translate";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import AssignmentIcon from "@mui/icons-material/Assignment";
import LocalHospitalIcon from "@mui/icons-material/LocalHospital";
import DateRangeIcon from "@mui/icons-material/DateRange";
import SearchIcon from "@mui/icons-material/Search";
import ArrowDropDown from "@mui/icons-material/ArrowDropDown";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";

const getColor = (count, requestType) => {
  const isPatientEscort = requestType === "patient_escort";

  if (count === 0) return "#f5f5f5";
  if (count <= 2) return isPatientEscort ? "#a5d6a7" : "#90caf9";
  if (count <= 5) return isPatientEscort ? "#66bb6a" : "#42a5f5";
  if (count <= 10) return isPatientEscort ? "#43a047" : "#1e88e5";
  return isPatientEscort ? "#2e7d32" : "#1565c0";
};

const HeatMapCalendar = ({
  data,
  startDate,
  endDate,
  currentUser,
  currentDateTime,
  selectedDataType,
}) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dayRequests, setDayRequests] = useState([]);
  const [currentTab, setCurrentTab] = useState(0);

  // สำหรับ year dropdown
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([]);
  const [filteredData, setFilteredData] = useState([]);

  // กำหนดประเภท request ตาม selectedDataType
  const requestType = selectedDataType || "patient_escort";
  const isPatientEscort = requestType === "patient_escort";

  // ค่าที่จะใช้จริง (ใช้ค่าที่กำหนดแน่นอน)
  const displayUser = currentUser;
  const displayDateTime = currentDateTime;

  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({
    key: "request_time",
    direction: "asc",
  });

  const getColorForValue = (count) => getColor(count, selectedDataType);

  // รวบรวมปีที่มีข้อมูล
  useEffect(() => {
    if (data && data.length > 0) {
      const years = new Set();
      data.forEach((request) => {
        if (request.request_date) {
          const year = new Date(request.request_date).getFullYear();
          years.add(year);
        }
      });

      const sortedYears = Array.from(years).sort((a, b) => b - a); // เรียงจากปีล่าสุด

      if (sortedYears.length > 0) {
        setAvailableYears(sortedYears);
        setSelectedYear(sortedYears[0]); // เลือกปีล่าสุด
      } else {
        setAvailableYears([new Date().getFullYear()]);
        setSelectedYear(new Date().getFullYear());
      }
    }
  }, [data]);

  // กรองข้อมูลตามปีที่เลือก
  useEffect(() => {
    if (data && data.length > 0) {
      const filtered = data.filter((request) => {
        if (request.request_date) {
          const year = new Date(request.request_date).getFullYear();
          return year === selectedYear;
        }
        return false;
      });
      setFilteredData(filtered);
    } else {
      setFilteredData([]);
    }
  }, [data, selectedYear]);

  // เปลี่ยนปี
  const handleYearChange = (event) => {
    setSelectedYear(event.target.value);
  };

  // ข้อมูล heat map
  const heatmapData = {};
  filteredData.forEach((request) => {
    if (request.request_date) {
      const date = request.request_date;
      heatmapData[date] = (heatmapData[date] || 0) + 1;
    }
  });

  // แปลงข้อมูลให้เป็นรูปแบบที่ component ต้องการ
  const calendarValues = Object.keys(heatmapData).map((date) => ({
    date,
    count: heatmapData[date],
  }));

  const handleDayClick = (value) => {
    if (!value || !value.date) return;

    // ดึงข้อมูล request
    const dayData = data.filter((req) => req.request_date === value.date);
    setDayRequests(dayData);
    setSelectedDay(value.date);
    setIsDialogOpen(true);
    setCurrentTab(0);
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const hourlyData =
    dayRequests.length > 0
      ? Array.from(
          dayRequests.reduce((acc, req) => {
            if (req.request_time) {
              const hour = req.request_time.split(":")[0].padStart(2, "0");
              const hourKey = `${hour}:00`;
              if (!acc.has(hourKey)) acc.set(hourKey, []);
              acc.get(hourKey).push(req);
            }
            return acc;
          }, new Map())
        ).map(([hour, requests]) => ({
          hour,
          count: requests.length,
          requests,
        }))
      : [];

  // จัดกลุ่มข้อมูลตาม staff
  const staffData =
    dayRequests.length > 0
      ? Array.from(
          dayRequests.reduce((acc, req) => {
            const staffName = req.staff_name || "Unknown";
            if (!acc.has(staffName)) acc.set(staffName, []);
            acc.get(staffName).push(req);
            return acc;
          }, new Map())
        ).map(([staffName, requests]) => ({
          staffName,
          count: requests.length,
          requests,
          extension: requests[0].staff_tel || "No contact",
          staffId: requests[0].staff_id || "Unknown",
          // สร้างอักษรตัวแรกของชื่อสำหรับ Avatar
          initials: staffName
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase(),
        }))
      : [];

  // กำหนด icon และ title ตามประเภท request
  const requestIcon = isPatientEscort ? (
    <DirectionsRunIcon />
  ) : (
    <TranslateIcon />
  );
  const requestColor = isPatientEscort ? "success" : "info";
  const requestTypeTitle = isPatientEscort ? "Patient Escort" : "Translator";
  const mainColor = isPatientEscort ? "#2e7d32" : "#0288d1"; // สีหลักตามประเภท

  // สีสำหรับ avatar
  const getAvatarColor = (name) => {
    const colors = [
      "#1976d2",
      "#388e3c",
      "#d32f2f",
      "#f57c00",
      "#7b1fa2",
      "#c2185b",
      "#0097a7",
      "#00796b",
      "#303f9f",
      "#616161",
    ];

    // ใช้ตัวอักษรตัวแรกในการเลือกสี
    const firstChar = (name || "").charAt(0).toUpperCase();
    const charCode = firstChar.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  // Search function
  const filterData = (data) => {
    if (!searchTerm) return data;

    return data.filter((item) => {
      return (
        (item.request_id &&
          String(item.request_id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (item.staff_name &&
          String(item.staff_name)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (item.base_service_point_id &&
          String(item.base_service_point_id)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (item.detail &&
          String(item.detail)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (item.patient_hn &&
          String(item.patient_hn)
            .toLowerCase()
            .includes(searchTerm.toLowerCase())) ||
        (item.lang &&
          String(item.lang).toLowerCase().includes(searchTerm.toLowerCase()))
      );
    });
  };

  // Sort function
  const sortData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter functions
  const filteredHourlyData = hourlyData
    .filter((hour) => {
      if (!searchTerm) return true;
      return hour.requests.some((req) => filterData([req]).length > 0);
    })
    .map((hour) => ({
      ...hour,
      requests: hour.requests.filter((req) => filterData([req]).length > 0),
    }));

  const filteredStaffData = staffData
    .filter((staff) => {
      if (!searchTerm) return true;
      return (
        staff.staffName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        staff.requests.some((req) => filterData([req]).length > 0)
      );
    })
    .map((staff) => ({
      ...staff,
      requests: staff.requests.filter((req) => filterData([req]).length > 0),
    }));

  const requestSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };

  const getStatusChipColor = (status) => {
    if (!status) return "default";

    status = status.toLowerCase();
    switch (status) {
      case "finished":
        return "success";
      case "pending":
        return "warning";
      case "accepted":
        return "info";
      case "canceled":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{ p: 2, borderRadius: 2, bgcolor: "#f9fafb" }}
      className="heatmap-container"
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
          pb: 2,
          borderBottom: `1px solid ${
            isPatientEscort
              ? "rgba(46, 125, 50, 0.2)"
              : "rgba(2, 136, 209, 0.2)"
          }`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Avatar sx={{ bgcolor: mainColor, mr: 2 }}>{requestIcon}</Avatar>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
            {requestTypeTitle} Activity Calendar
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          {/* Year Dropdown */}
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="year-select-label">Year</InputLabel>
            <Select
              labelId="year-select-label"
              id="year-select"
              value={selectedYear}
              label="Year"
              onChange={handleYearChange}
              startAdornment={
                <DateRangeIcon sx={{ mr: 1, color: mainColor }} />
              }
            >
              {availableYears.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: 2,
          border: `1px solid ${
            isPatientEscort
              ? "rgba(46, 125, 50, 0.2)"
              : "rgba(2, 136, 209, 0.2)"
          }`,
          bgcolor: "white",
        }}
      >
        <Box
          sx={{
            mb: 1,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 500,
              color: mainColor,
              display: "flex",
              alignItems: "center",
            }}
          >
            <EventIcon fontSize="small" sx={{ mr: 0.5 }} />
            Click on a day to see detailed requests
          </Typography>

          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Showing data for {selectedYear}
          </Typography>
        </Box>

        <div style={{ width: "100%", height: "100%" }}>
          <CalendarHeatmap
            startDate={new Date(`${selectedYear}-01-01`)}
            endDate={new Date(`${selectedYear}-12-31`)}
            values={calendarValues}
            classForValue={(value) => {
              if (!value || value.count === 0) {
                return "color-empty";
              }
              let level;
              if (value.count <= 2) level = 1;
              else if (value.count <= 5) level = 2;
              else if (value.count <= 10) level = 3;
              else level = 4;
              return `color-scale-${level} ${
                isPatientEscort ? "escort" : "translator"
              }`;
            }}
            tooltipDataAttrs={(value) => {
              if (!value || !value.date) return null;

              return {
                "data-tooltip-id": "calendar-tooltip",
                "data-tooltip-html": `
                  <div style="padding: 8px;">
                    <strong style="font-size: 14px;">${value.date}</strong>
                    <br />
                    <span style="font-size: 13px;">
                      ${requestTypeTitle} Requests: <b>${value.count || 0}</b>
                    </span>
                  </div>
                `,
              };
            }}
            onClick={handleDayClick}
          />

          {/* การใช้ ReactTooltip เวอร์ชันใหม่ */}
          <ReactTooltip
            id="calendar-tooltip"
            html={true}
            style={{
              backgroundColor: "rgba(33, 33, 33, 0.9)",
              borderRadius: "4px",
              fontSize: "12px",
            }}
          />

          {/* Custom CSS for heatmap */}
          <style jsx="true">{`
            .color-empty {
              fill: #f5f5f5;
              rx: 2px;
              ry: 2px;
              stroke: rgba(0, 0, 0, 0.04);
              stroke-width: 0.5;
            }
            .color-scale-1.escort {
              fill: #a5d6a7;
              opacity: 0.95;
              stroke: rgba(46, 125, 50, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-2.escort {
              fill: #66bb6a;
              opacity: 0.95;
              stroke: rgba(46, 125, 50, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-3.escort {
              fill: #43a047;
              opacity: 0.95;
              stroke: rgba(46, 125, 50, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-4.escort {
              fill: #2e7d32;
              opacity: 0.95;
              stroke: rgba(46, 125, 50, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-1.translator {
              fill: #90caf9;
              opacity: 0.95;
              stroke: rgba(2, 136, 209, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-2.translator {
              fill: #42a5f5;
              opacity: 0.95;
              stroke: rgba(2, 136, 209, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-3.translator {
              fill: #1e88e5;
              opacity: 0.95;
              stroke: rgba(2, 136, 209, 0.1);
              stroke-width: 0.5;
            }
            .color-scale-4.translator {
              fill: #1565c0;
              opacity: 0.95;
              stroke: rgba(2, 136, 209, 0.1);
              stroke-width: 0.5;
            }
            .react-calendar-heatmap .react-calendar-heatmap-small-text {
              font-size: 5px;
              font-weight: 500;
            }
            .react-calendar-heatmap rect {
              rx: 2px;
              ry: 2px;
              transition: all 0.2s ease;
            }
            .react-calendar-heatmap rect:hover {
              stroke: rgba(0, 0, 0, 0.2);
              stroke-width: 1;
              cursor: pointer;
              filter: brightness(0.95);
            }
            .react-calendar-heatmap .react-calendar-heatmap-month-labels,
            .react-calendar-heatmap .react-calendar-heatmap-weekday-labels {
              font-size: 8px;
              fill: #666;
              font-weight: 500;
            }
            .react-calendar-heatmap text {
              font-size: 10px;
              fill: #666;
              font-weight: 500;
            }
            .react-calendar-heatmap .color-empty,
            .react-calendar-heatmap .color-scale-1,
            .react-calendar-heatmap .color-scale-2,
            .react-calendar-heatmap .color-scale-3,
            .react-calendar-heatmap .color-scale-4 {
              shape-rendering: geometricPrecision;
            }
          `}</style>
        </div>
      </Paper>

      {/* Dialog แสดงรายละเอียดเมื่อคลิกที่วัน - ปรับปรุงให้มี AppBar และ Tabs */}
      <Dialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          elevation: 5,
          sx: {
            borderRadius: "8px",
            overflow: "hidden",
          },
        }}
      >
        <AppBar
          position="static"
          sx={{
            position: "relative",
            bgcolor: mainColor,
          }}
        >
          <Toolbar>
            <Box sx={{ display: "flex", alignItems: "center", mr: 2 }}>
              <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", mr: 1.5 }}>
                {requestIcon}
              </Avatar>
              <Typography sx={{ flex: 1 }} variant="h6" component="div">
                {requestTypeTitle} Requests on {selectedDay}
              </Typography>
            </Box>

            <Chip
              label={`${dayRequests.length} requests`}
              color="default"
              size="small"
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "white",
                fontWeight: 500,
                mr: 2,
              }}
            />
            <IconButton
              edge="end"
              color="inherit"
              onClick={() => setIsDialogOpen(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>

          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            indicatorColor="secondary"
            textColor="inherit"
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              bgcolor: "rgba(0,0,0,0.1)",
              "& .MuiTab-root": {
                minHeight: "48px",
                fontWeight: 500,
              },
            }}
          >
            <Tab
              label="All Requests"
              icon={<AssignmentIcon />}
              iconPosition="start"
            />
            <Tab
              label="By Hour"
              icon={<AccessTimeIcon />}
              iconPosition="start"
            />
            <Tab
              label="By Staff"
              icon={<AccountCircleIcon />}
              iconPosition="start"
            />
          </Tabs>
        </AppBar>

        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              placeholder="Search requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
                endAdornment: searchTerm && (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => setSearchTerm("")}
                      edge="end"
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </Box>

          {searchTerm && (
            <Box sx={{ px: 2, py: 1, bgcolor: "background.default" }}>
              <Typography variant="body2" color="text.secondary">
                Found {filterData(dayRequests).length} matching results
                <Button
                  size="small"
                  onClick={() => setSearchTerm("")}
                  startIcon={<CloseIcon />}
                  sx={{ ml: 2 }}
                >
                  Clear search
                </Button>
              </Typography>
            </Box>
          )}

          {currentTab === 0 && (
            <div className="request-table-container">
              {dayRequests.length > 0 ? (
                <Table stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell
                        onClick={() => requestSort("request_id")}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                          userSelect: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          Request ID
                          {sortConfig.key === "request_id" && (
                            <ArrowDropDown
                              sx={{
                                transform:
                                  sortConfig.direction === "desc"
                                    ? "rotate(180deg)"
                                    : "none",
                                transition: "0.2s",
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        onClick={() => requestSort("staff_name")}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                          userSelect: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          Staff Name
                          {sortConfig.key === "staff_name" && (
                            <ArrowDropDown
                              sx={{
                                transform:
                                  sortConfig.direction === "desc"
                                    ? "rotate(180deg)"
                                    : "none",
                                transition: "0.2s",
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        onClick={() => requestSort("request_time")}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                          userSelect: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          Request Time
                          {sortConfig.key === "request_time" && (
                            <ArrowDropDown
                              sx={{
                                transform:
                                  sortConfig.direction === "desc"
                                    ? "rotate(180deg)"
                                    : "none",
                                transition: "0.2s",
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        onClick={() => requestSort("base_service_point_id")}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                          userSelect: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          Department
                          {sortConfig.key === "base_service_point_id" && (
                            <ArrowDropDown
                              sx={{
                                transform:
                                  sortConfig.direction === "desc"
                                    ? "rotate(180deg)"
                                    : "none",
                                transition: "0.2s",
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell
                        onClick={() => requestSort("status")}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                          userSelect: "none",
                        }}
                      >
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          Status
                          {sortConfig.key === "status" && (
                            <ArrowDropDown
                              sx={{
                                transform:
                                  sortConfig.direction === "desc"
                                    ? "rotate(180deg)"
                                    : "none",
                                transition: "0.2s",
                                ml: 0.5,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      {isPatientEscort ? (
                        <TableCell
                          onClick={() => requestSort("patient_hn")}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                            userSelect: "none",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            Patient HN
                            {sortConfig.key === "patient_hn" && (
                              <ArrowDropDown
                                sx={{
                                  transform:
                                    sortConfig.direction === "desc"
                                      ? "rotate(180deg)"
                                      : "none",
                                  transition: "0.2s",
                                  ml: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      ) : (
                        <TableCell
                          onClick={() => requestSort("lang")}
                          sx={{
                            cursor: "pointer",
                            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                            userSelect: "none",
                          }}
                        >
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            Language
                            {sortConfig.key === "lang" && (
                              <ArrowDropDown
                                sx={{
                                  transform:
                                    sortConfig.direction === "desc"
                                      ? "rotate(180deg)"
                                      : "none",
                                  transition: "0.2s",
                                  ml: 0.5,
                                }}
                              />
                            )}
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>Detail</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {dayRequests.map((request) => (
                      <TableRow key={request.request_id} hover>
                        <TableCell>
                          <Chip
                            label={request.request_id}
                            variant="outlined"
                            size="small"
                            sx={{
                              fontFamily: "monospace",
                              fontWeight: 600,
                              fontSize: "0.75rem",
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                mr: 1.5,
                                bgcolor: getAvatarColor(request.staff_name),
                                fontSize: "0.875rem",
                                fontWeight: 600,
                              }}
                            >
                              {request.staff_name
                                ? request.staff_name[0].toUpperCase()
                                : "U"}
                            </Avatar>
                            <div className="staff-info">
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 500 }}
                              >
                                {request.staff_name || "Unknown"}
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ display: "block" }}
                              >
                                {request.staff_tel || "No contact"} • ID:{" "}
                                {request.staff_id || "N/A"}
                              </Typography>
                            </div>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <AccessTimeIcon
                              fontSize="small"
                              sx={{
                                mr: 1,
                                color: "text.secondary",
                                opacity: 0.7,
                              }}
                            />
                            <Typography variant="body2">
                              {request.request_time}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {request.base_service_point_id || "N/A"}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={request.status || "Unknown"}
                            color={getStatusChipColor(request.status)}
                            size="small"
                            sx={{ fontWeight: 500 }}
                          />
                        </TableCell>
                        {isPatientEscort && (
                          <TableCell>
                            {request.patient_hn ? (
                              <Box
                                sx={{ display: "flex", alignItems: "center" }}
                              >
                                <LocalHospitalIcon
                                  fontSize="small"
                                  sx={{ mr: 0.5, color: "primary.main" }}
                                />
                                <Typography
                                  variant="body2"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {request.patient_hn}
                                </Typography>
                              </Box>
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        {!isPatientEscort && (
                          <TableCell>
                            {request.lang ? (
                              <Chip
                                label={request.lang}
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 500 }}
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                N/A
                              </Typography>
                            )}
                          </TableCell>
                        )}
                        <TableCell>
                          <Typography
                            variant="body2"
                            sx={{
                              maxWidth: "200px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {request.detail || "No details provided"}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <Box
                  sx={{
                    p: 5,
                    textAlign: "center",
                    bgcolor: "background.paper",
                    borderRadius: 1,
                  }}
                >
                  <EventIcon
                    sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                  />
                  <Typography variant="h6" color="text.secondary">
                    No request data available for this date
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.disabled"
                    sx={{ mt: 1 }}
                  >
                    Try selecting another day from the calendar
                  </Typography>
                </Box>
              )}
            </div>
          )}

          {/* Tab 2: By Hour */}
          {currentTab === 1 && (
            <div className="request-table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      width="15%"
                      onClick={() => requestSort("hour")}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        userSelect: "none",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Hour
                        {sortConfig.key === "hour" && (
                          <ArrowDropDown
                            sx={{
                              transform:
                                sortConfig.direction === "desc"
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "0.2s",
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      width="15%"
                      onClick={() => requestSort("count")}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        userSelect: "none",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Request Count
                        {sortConfig.key === "count" && (
                          <ArrowDropDown
                            sx={{
                              transform:
                                sortConfig.direction === "desc"
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "0.2s",
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell width="70%">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filteredHourlyData).map((hour) => (
                    <TableRow key={hour.hour} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <AccessTimeIcon
                            fontSize="small"
                            sx={{ mr: 1, color: mainColor }}
                          />
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {hour.hour}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={hour.count}
                          color={requestColor}
                          size="small"
                          sx={{ fontWeight: 700, minWidth: "40px" }}
                        />
                      </TableCell>
                      <TableCell>
                        <Paper
                          variant="outlined"
                          sx={{
                            maxHeight: "170px",
                            overflowY: "auto",
                            p: 0.5,
                            borderColor: "rgba(0,0,0,0.08)",
                          }}
                        >
                          {hour.requests.map((req) => (
                            <Paper
                              key={req.request_id}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                borderColor: "rgba(0,0,0,0.08)",
                                borderLeft: `4px solid ${
                                  isPatientEscort ? "#2e7d32" : "#0288d1"
                                }`,
                                "&:last-child": { mb: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {req.request_time}
                                  </Typography>
                                  <Chip
                                    label={req.status || "Unknown"}
                                    color={getStatusChipColor(req.status)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      ml: 1,
                                      height: "20px",
                                      "& .MuiChip-label": {
                                        px: 1,
                                        py: 0,
                                        fontSize: "0.625rem",
                                      },
                                    }}
                                  />
                                </Box>

                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontWeight: 500,
                                  }}
                                >
                                  ID: {req.request_id}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <Avatar
                                    sx={{
                                      width: 24,
                                      height: 24,
                                      mr: 1,
                                      fontSize: "0.75rem",
                                      bgcolor: getAvatarColor(req.staff_name),
                                    }}
                                  >
                                    {req.staff_name
                                      ? req.staff_name[0].toUpperCase()
                                      : "U"}
                                  </Avatar>
                                  <Typography variant="caption">
                                    {req.staff_name || "Unknown"}
                                  </Typography>
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{ color: "text.secondary" }}
                                >
                                  {req.base_service_point_id || "N/A"}
                                </Typography>
                              </Box>
                              <Box
                                sx={{
                                  mt: 0.5,
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    maxWidth: "150px",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {req.detail || "No details"}
                                </Typography>

                                {isPatientEscort
                                  ? req.patient_hn && (
                                      <Chip
                                        label={`HN: ${req.patient_hn}`}
                                        size="small"
                                        variant="outlined"
                                        color="primary"
                                        sx={{
                                          height: "20px",
                                          "& .MuiChip-label": {
                                            px: 1,
                                            py: 0,
                                            fontSize: "0.625rem",
                                          },
                                        }}
                                      />
                                    )
                                  : req.lang && (
                                      <Chip
                                        label={req.lang}
                                        size="small"
                                        variant="outlined"
                                        color="info"
                                        sx={{
                                          height: "20px",
                                          "& .MuiChip-label": {
                                            px: 1,
                                            py: 0,
                                            fontSize: "0.625rem",
                                          },
                                        }}
                                      />
                                    )}
                              </Box>
                            </Paper>
                          ))}
                        </Paper>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredHourlyData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <AccessTimeIcon
                            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No hourly data available
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Tab 3: By Staff */}
          {currentTab === 2 && (
            <div className="request-table-container">
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell
                      width="25%"
                      onClick={() => requestSort("staffName")}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        userSelect: "none",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Staff Name
                        {sortConfig.key === "staffName" && (
                          <ArrowDropDown
                            sx={{
                              transform:
                                sortConfig.direction === "desc"
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "0.2s",
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell
                      width="15%"
                      onClick={() => requestSort("count")}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
                        userSelect: "none",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        Request Count
                        {sortConfig.key === "count" && (
                          <ArrowDropDown
                            sx={{
                              transform:
                                sortConfig.direction === "desc"
                                  ? "rotate(180deg)"
                                  : "none",
                              transition: "0.2s",
                              ml: 0.5,
                            }}
                          />
                        )}
                      </Box>
                    </TableCell>
                    <TableCell width="60%">Details</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sortData(filteredStaffData).map((staff) => (
                    <TableRow key={staff.staffName} hover>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              mr: 1.5,
                              bgcolor: getAvatarColor(staff.staffName),
                              fontWeight: 600,
                            }}
                          >
                            {staff.initials}
                          </Avatar>
                          <div className="staff-info">
                            <Typography
                              variant="body1"
                              sx={{ fontWeight: 500 }}
                            >
                              {staff.staffName}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                              sx={{ display: "block" }}
                            >
                              {staff.extension} • ID: {staff.staffId || "N/A"}
                            </Typography>
                          </div>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={staff.count}
                          color={requestColor}
                          size="small"
                          sx={{ fontWeight: 700, minWidth: "40px" }}
                        />
                      </TableCell>
                      
                      <TableCell>
                        <Paper
                          variant="outlined"
                          sx={{
                            maxHeight: "170px",
                            overflowY: "auto",
                            p: 0.5,
                            borderColor: "rgba(0,0,0,0.08)",
                          }}
                        >
                          {staff.requests.map((req) => (
                            <Paper
                              key={req.request_id}
                              variant="outlined"
                              sx={{
                                mb: 1,
                                p: 1,
                                borderRadius: 1,
                                borderColor: "rgba(0,0,0,0.08)",
                                borderLeft: `4px solid ${
                                  isPatientEscort ? "#2e7d32" : "#0288d1"
                                }`,
                                "&:last-child": { mb: 0 },
                              }}
                            >
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  mb: 0.5,
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                  }}
                                >
                                  <AccessTimeIcon
                                    fontSize="small"
                                    sx={{ mr: 0.5, opacity: 0.7 }}
                                  />
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {req.request_time}
                                  </Typography>
                                  <Chip
                                    label={req.status || "Unknown"}
                                    color={getStatusChipColor(req.status)}
                                    size="small"
                                    variant="outlined"
                                    sx={{
                                      ml: 1,
                                      height: "20px",
                                      "& .MuiChip-label": {
                                        px: 1,
                                        py: 0,
                                        fontSize: "0.625rem",
                                      },
                                    }}
                                  />
                                </Box>

                                <Typography
                                  variant="caption"
                                  sx={{
                                    color: "text.secondary",
                                    fontWeight: 500,
                                  }}
                                >
                                  ID: {req.request_id}
                                </Typography>
                              </Box>

                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                }}
                              >
                                <Typography
                                  variant="caption"
                                  sx={{ fontWeight: 500 }}
                                >
                                  {req.base_service_point_id || "N/A"}
                                </Typography>

                                {/* Patient HN or Language */}
                                <Box
                                  sx={{
                                    mt: 0.5,
                                    display: "flex",
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  {isPatientEscort
                                    ? req.patient_hn && (
                                        <Chip
                                          label={`HN: ${req.patient_hn}`}
                                          size="small"
                                          variant="outlined"
                                          color="primary"
                                          sx={{
                                            height: "20px",
                                            "& .MuiChip-label": {
                                              px: 1,
                                              py: 0,
                                              fontSize: "0.625rem",
                                            },
                                          }}
                                        />
                                      )
                                    : req.lang && (
                                        <Chip
                                          label={req.lang}
                                          size="small"
                                          variant="outlined"
                                          color="info"
                                          sx={{
                                            height: "20px",
                                            "& .MuiChip-label": {
                                              px: 1,
                                              py: 0,
                                              fontSize: "0.625rem",
                                            },
                                          }}
                                        />
                                      )}
                                </Box>
                              </Box>

                              {req.detail && (
                                <Box sx={{ mt: 0.5 }}>
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: "text.secondary",
                                      fontStyle: "italic",
                                    }}
                                  >
                                    "{req.detail}"
                                  </Typography>
                                </Box>
                              )}
                            </Paper>
                          ))}
                        </Paper>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredStaffData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} align="center">
                        <Box sx={{ py: 4, textAlign: "center" }}>
                          <AccountCircleIcon
                            sx={{ fontSize: 48, color: "text.disabled", mb: 2 }}
                          />
                          <Typography variant="h6" color="text.secondary">
                            No staff data available
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Paper>
  );
};

export default HeatMapCalendar;
