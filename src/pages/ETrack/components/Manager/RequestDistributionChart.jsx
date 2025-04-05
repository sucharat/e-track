import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LabelList,
  Cell,
  ReferenceLine,
  Area
} from 'recharts';
import {
  Paper,
  Typography,
  Box,
  Grid,
  Chip,
  Divider,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  ToggleButtonGroup,
  ToggleButton,
  IconButton,
  Menu
} from '@mui/material';

import { CHART_COLORS } from './ChartSection';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';
import TimelineIcon from '@mui/icons-material/Timeline';
import TodayIcon from '@mui/icons-material/Today';
import ViewWeekIcon from '@mui/icons-material/ViewWeek';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FilterListIcon from '@mui/icons-material/FilterList';
import PercentIcon from '@mui/icons-material/Percent';

const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const timeCategories = ['Early Morning', 'Morning', 'Afternoon', 'Evening'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

// Simple date utility functions (avoiding date-fns dependency)
const formatDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const formatDateForDisplay = (date) => {
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  return `${day} ${month}`;
};

const formatFullDateForDisplay = (date) => {
  const day = date.getDate();
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

const getStartOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay(); // 0 = Sunday, 1 = Monday, etc.
  result.setDate(result.getDate() - day); // Go back to the beginning of the week (Sunday)
  return result;
};

const getEndOfWeek = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  result.setDate(result.getDate() + (6 - day)); // Go forward to the end of the week (Saturday)
  return result;
};

const isDateInRange = (date, start, end) => {
  const d = new Date(date);
  return d >= start && d <= end;
};

const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const RequestDistributionChart = ({
  data,
  title,
  selectedDataType,
  currentUser,
  currentDateTime
}) => {
  // Add state for chart type selection
  const [chartType, setChartType] = useState('distribution');

  // Parse the current date from the currentDateTime prop
  const parsedCurrentDate = useMemo(() => {
    try {
      // Parse the date string from currentDateTime (format: YYYY-MM-DD HH:MM:SS)
      const dateString = currentDateTime.split(' ')[0]; // Extract YYYY-MM-DD part
      return new Date(dateString);
    } catch (error) {
      return new Date(); // Fallback to today if parsing fails
    }
  }, [currentDateTime]);

  // Add state for hourly filter
  const [hourlyFilterType, setHourlyFilterType] = useState('daily');
  const [selectedDate, setSelectedDate] = useState(parsedCurrentDate); // Default to current date

  // State for date selector menu
  const [dateMenuAnchor, setDateMenuAnchor] = useState(null);
  const [displayedMonth, setDisplayedMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1)
  );

  // Calculate the date range based on data
  const calculateDateRange = () => {
    if (!data || data.length === 0) {
      return { startDate: 'N/A', endDate: 'N/A' };
    }

    let dates = data
      .filter(item => item.request_date)
      .map(item => new Date(item.request_date));

    // If no valid dates, return N/A
    if (dates.length === 0) {
      return { startDate: 'N/A', endDate: 'N/A' };
    }

    const startDate = new Date(Math.min(...dates));
    const endDate = new Date(Math.max(...dates));

    return {
      startDate: formatDate(startDate),
      endDate: formatDate(endDate),
      startDateObj: startDate,
      endDateObj: endDate
    };
  };

  const dateRange = calculateDateRange();

  // Function to process daily distribution
  const processDailyDistribution = () => {
    // Initialize counts for each day of the week
    const dayCounts = Array(7).fill(0).map((_, i) => ({
      name: daysOfWeek[i],
      shortName: shortDays[i],
      count: 0,
      color: CHART_COLORS.primary[selectedDataType === 'patient_escort' ? 'escort' : 'translator'][i % CHART_COLORS.primary.escort.length]
    }));

    // Count requests for each day
    data.forEach(request => {
      if (request.request_date) {
        const date = new Date(request.request_date);
        const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
        dayCounts[dayOfWeek].count++;
      }
    });

    // Calculate percentages and add additional data
    const totalRequests = dayCounts.reduce((sum, day) => sum + day.count, 0);

    return dayCounts.map(day => ({
      ...day,
      percentage: totalRequests > 0 ? ((day.count / totalRequests) * 100).toFixed(1) : 0,
    }));
  };

  // Function to process Daily Trends data
  const processDateTrends = () => {
    // Create a map to track requests by date
    const requestsByDate = {};

    // Process each request to categorize by date
    data.forEach(request => {
      if (request.request_date) {
        const date = request.request_date.substring(0, 10); // Extract YYYY-MM-DD
        if (!requestsByDate[date]) {
          const dateObj = new Date(date);
          requestsByDate[date] = {
            date,
            count: 0,
            displayDate: `${monthNames[dateObj.getMonth()].substring(0, 3)} ${dateObj.getDate()}`
          };
        }
        requestsByDate[date].count++;
      }
    });

    // Convert to array and sort by date
    let trendsData = Object.values(requestsByDate).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    // Calculate moving average (7-day)
    const calculateMovingAvg = (data, window = 7) => {
      return data.map((item, index) => {
        const startIdx = Math.max(0, index - window + 1);
        const slice = data.slice(startIdx, index + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.count, 0);
        return {
          ...item,
          movingAvg: slice.length > 0 ? (sum / slice.length).toFixed(1) : 0
        };
      });
    };

    trendsData = calculateMovingAvg(trendsData);

    // Calculate trend indicators
    if (trendsData.length > 1) {
      trendsData = trendsData.map((item, index) => {
        if (index === 0) return { ...item, trend: 0 };

        const prevCount = trendsData[index - 1].count;
        const currentCount = item.count;
        const trend = currentCount - prevCount;

        return {
          ...item,
          trend,
          trendPercent: prevCount > 0 ? ((trend / prevCount) * 100).toFixed(1) : 0
        };
      });
    }

    return trendsData;
  };

  // Function to filter hourly data based on selected filter and date
  const filterHourlyData = (hourlyData) => {
    if (!data || data.length === 0) return hourlyData;

    // For daily filter - only return data for the selected date
    if (hourlyFilterType === 'daily') {
      const selectedFormattedDate = formatDate(selectedDate);

      return hourlyData.map(hourData => {
        // Clone the hour data
        const filteredHour = { ...hourData };

        // Filter dates for this hour to only include the selected date
        filteredHour.dates = (hourData.dates || []).filter(dateItem =>
          dateItem.date === selectedFormattedDate
        );

        // Update count based on filtered dates
        filteredHour.count = filteredHour.dates.reduce((sum, date) => sum + date.count, 0);

        return filteredHour;
      });
    }
    // For weekly filter - only return data for the selected week
    else if (hourlyFilterType === 'weekly') {
      // Calculate the start and end of the week
      const weekStart = getStartOfWeek(selectedDate);
      const weekEnd = getEndOfWeek(selectedDate);

      return hourlyData.map(hourData => {
        // Clone the hour data
        const filteredHour = { ...hourData };

        // Filter dates for this hour to only include dates within the selected week
        filteredHour.dates = (hourData.dates || []).filter(dateItem => {
          const itemDate = new Date(dateItem.date);
          return isDateInRange(itemDate, weekStart, weekEnd);
        });

        // Update count based on filtered dates
        filteredHour.count = filteredHour.dates.reduce((sum, date) => sum + date.count, 0);

        return filteredHour;
      });
    }

    return hourlyData; // Return all data if no filter applied
  };

  // Function to process hourly distribution with dates
  const processHourlyDistribution = () => {
    // Initialize counts for each hour of the day
    const hourCounts = Array(24).fill(0).map((_, i) => ({
      hour: i,
      displayHour: i < 12 ? `${i === 0 ? 12 : i}am` : `${i === 12 ? 12 : i - 12}pm`,
      displayHourFormatted: i < 12
        ? `${i === 0 ? 12 : i} AM`
        : `${i === 12 ? 12 : i - 12} PM`,
      count: 0,
      dates: [], // Store individual dates for this hour
      color: i < 6 ? CHART_COLORS.accent.indigo :
        i < 12 ? CHART_COLORS.accent.blue :
          i < 18 ? CHART_COLORS.accent.amber :
            CHART_COLORS.accent.purple,
      timeCategory: i < 6 ? 'Early Morning' :
        i < 12 ? 'Morning' :
          i < 18 ? 'Afternoon' : 'Evening'
    }));

    // Function to get date string from request
    const getDateFromRequest = (request) => {
      if (!request.request_date) return null;
      return request.request_date.substring(0, 10); // Extract YYYY-MM-DD
    };

    // Count requests for each hour, keeping track of dates
    data.forEach(request => {
      if (request.request_time) {
        const time = request.request_time.split(':');
        const hour = parseInt(time[0], 10);

        if (!isNaN(hour) && hour >= 0 && hour < 24) {
          // Get the date for this request
          const dateStr = getDateFromRequest(request);

          if (dateStr) {
            // Increment the total count for this hour
            hourCounts[hour].count++;

            // Look for an existing entry for this date
            const existingDateIndex = hourCounts[hour].dates.findIndex(
              d => d.date === dateStr
            );

            if (existingDateIndex >= 0) {
              // Increment count for this date
              hourCounts[hour].dates[existingDateIndex].count++;
            } else {
              const dateObj = new Date(dateStr);
              // Add a new date entry
              hourCounts[hour].dates.push({
                date: dateStr,
                displayDate: `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`,
                count: 1
              });
            }
          }
        }
      }
    });

    // Calculate percentages
    const totalRequests = hourCounts.reduce((sum, hour) => sum + hour.count, 0);

    // Sort dates for each hour
    hourCounts.forEach(hour => {
      hour.dates.sort((a, b) => new Date(a.date) - new Date(b.date));
    });

    return hourCounts.map(hour => ({
      ...hour,
      percentage: totalRequests > 0 ? ((hour.count / totalRequests) * 100).toFixed(1) : 0
    }));
  };

  // Calculate all datasets
  const dailyData = processDailyDistribution();
  const hourlyData = useMemo(() => processHourlyDistribution(), [data]);
  const filteredHourlyData = filterHourlyData(hourlyData);
  const trendsData = processDateTrends();

  // Find peak day
  const peakDayCount = Math.max(...dailyData.map(item => item.count));
  const peakDays = dailyData.filter(item => item.count === peakDayCount);

  // Find peak hour in filtered data
  const peakHourCount = Math.max(...filteredHourlyData.map(item => item.count));
  const peakHours = filteredHourlyData.filter(item => item.count === peakHourCount && item.count > 0);

  // Calculate time category distribution
  const timeCategoryDistribution = timeCategories.map(category => {
    const hours = filteredHourlyData.filter(h => h.timeCategory === category);
    const count = hours.reduce((sum, hour) => sum + hour.count, 0);
    return {
      name: category,
      count: count,
      percentage: data.length > 0 ? ((count / data.length) * 100).toFixed(1) : 0,
    };
  });

  // Find busiest time category
  const busiestCategory = timeCategoryDistribution.reduce((max, cat) =>
    max.count > cat.count ? max : cat, { count: 0 });

  // For trends data
  const totalTrendsRequests = trendsData.reduce((sum, day) => sum + day.count, 0);
  const avgDailyRequests = trendsData.length > 0
    ? (totalTrendsRequests / trendsData.length).toFixed(1)
    : 0;

  // Calculate peak trend day
  const peakTrendDay = trendsData.reduce((max, day) =>
    max.count > day.count ? max : day, { count: 0 });

  // Calculate total weekly requests for percentage display
  const totalWeeklyRequests = dailyData.reduce((sum, day) => sum + day.count, 0);

  // Format for tooltips and labels
  const formatNumber = (num) => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const mainColor = selectedDataType === 'patient_escort' ?
    CHART_COLORS.accent.teal :
    CHART_COLORS.primary.translator[2];

  // Calculate hourly timeline data with better visualization
  const hourlyTimelineData = timeCategories.map(category => {
    const hours = filteredHourlyData.filter(h => h.timeCategory === category);
    const count = hours.reduce((sum, hour) => sum + hour.count, 0);
    const peakHourInCategory = hours.reduce((max, hour) =>
      max.count > hour.count ? max : hour, { count: 0 });

    return {
      category,
      count,
      percentage: data.length > 0 ? ((count / data.length) * 100).toFixed(1) : 0,
      peakHour: peakHourInCategory.displayHourFormatted || 'N/A',
      peakHourCount: peakHourInCategory.count,
      color: hours[0]?.color || CHART_COLORS.accent.blue,
    };
  });

  const handleChartTypeChange = (event) => {
    setChartType(event.target.value);
  };

  const handleHourlyFilterChange = (event, newValue) => {
    // Only update if a valid value is selected
    if (newValue !== null) {
      setHourlyFilterType(newValue);
    }
  };

  // Date picker menu functions
  const handleOpenDateMenu = (event) => {
    setDateMenuAnchor(event.currentTarget);
  };

  const handleCloseDateMenu = () => {
    setDateMenuAnchor(null);
  };

  const handlePrevMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setDisplayedMonth(new Date(displayedMonth.getFullYear(), displayedMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    handleCloseDateMenu();
  };

  const handleTodayClick = () => {
    setSelectedDate(parsedCurrentDate);
    handleCloseDateMenu();
  };

  // Navigate to the previous day
  const handlePrevDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, -1));
  };

  // Navigate to the next day
  const handleNextDay = () => {
    setSelectedDate(prevDate => addDays(prevDate, 1));
  };

  // Generate days for the current month
  const generateDaysGrid = () => {
    const year = displayedMonth.getFullYear();
    const month = displayedMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();

    // Calculate dates from previous month to fill the first row
    const daysFromPrevMonth = firstDay;
    const prevMonthLastDate = new Date(year, month, 0).getDate();

    // Calculate how many days to display from next month
    const totalDaysToShow = 42; // 6 rows of 7 days
    const daysFromNextMonth = totalDaysToShow - lastDate - daysFromPrevMonth;

    const days = [];

    // Add days from previous month
    for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDate - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: formatDate(date) === formatDate(parsedCurrentDate),
        isSelected: formatDate(date) === formatDate(selectedDate)
      });
    }

    // Add days from current month
    for (let i = 1; i <= lastDate; i++) {
      const date = new Date(year, month, i);
      days.push({
        date,
        isCurrentMonth: true,
        isToday: formatDate(date) === formatDate(parsedCurrentDate),
        isSelected: formatDate(date) === formatDate(selectedDate)
      });
    }

    // Add days from next month
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: formatDate(date) === formatDate(parsedCurrentDate),
        isSelected: formatDate(date) === formatDate(selectedDate)
      });
    }

    return days;
  };

  // Get display text for the current date filter
  const getDateFilterDisplayText = () => {
    if (hourlyFilterType === 'daily') {
      return formatFullDateForDisplay(selectedDate);
    } else if (hourlyFilterType === 'weekly') {
      const weekStart = getStartOfWeek(selectedDate);
      const weekEnd = getEndOfWeek(selectedDate);
      return `${formatDateForDisplay(weekStart)} - ${formatFullDateForDisplay(weekEnd)}`;
    }
    return '';
  };

  // Custom tooltip for hourly chart
  const CustomHourlyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isBusiestHour = data.count === peakHourCount;

      // Get date information for the tooltip
      const dateEntries = data.dates || [];

      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          minWidth: '220px',
          maxWidth: '300px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            borderBottom: '1px solid #eee',
            paddingBottom: '4px'
          }}>
            <span style={{ marginRight: '5px' }}>🕚</span>
            {data.displayHourFormatted}
          </div>

          <div style={{ fontSize: '13px', margin: '4px 0' }}>
            <span style={{ marginRight: '5px' }}>📌</span>
            <span style={{ fontWeight: '600' }}>Total Requests:</span> {formatNumber(data.count)}
          </div>

          {/* Display all dates that have requests for this hour */}
          {dateEntries.length > 0 && (
            <div style={{ marginTop: '8px', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                Request Details:
              </div>
              <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                {dateEntries.map((dateItem, idx) => (
                  <div
                    key={`date-${idx}`}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      padding: '3px 0',
                      borderBottom: idx < dateEntries.length - 1 ? '1px dotted #eee' : 'none'
                    }}
                  >
                    <span>{dateItem.displayDate}:</span>
                    <span style={{ fontWeight: '600' }}>{dateItem.count} requests</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {isBusiestHour && (
            <div style={{
              fontSize: '12px',
              color: CHART_COLORS.accent.orange,
              fontWeight: 'bold',
              marginTop: '8px',
              backgroundColor: `${CHART_COLORS.accent.orange}10`,
              padding: '3px 6px',
              borderRadius: '4px'
            }}>
              📊 Busiest Hour of the Day
            </div>
          )}

          <div style={{
            fontSize: '11px',
            color: '#777',
            marginTop: '6px',
            fontStyle: 'italic'
          }}>
            Time category: {data.timeCategory}
          </div>
        </div>
      );
    }
    return null;
  };

  // Enhanced tooltip for daily data that includes better percentage display
  const CustomDailyTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const isPeakDay = data.count === peakDayCount;

      // Calculate percentage with more precision for display
      const percentage = parseFloat(data.percentage);
      const requestCount = data.count;

      return (
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          padding: '12px',
          border: 'none',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          minWidth: '200px'
        }}>
          <div style={{
            fontSize: '14px',
            fontWeight: 'bold',
            marginBottom: '8px',
            color: data.color,
            borderBottom: `1px solid ${data.color}40`,
            paddingBottom: '4px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span>{data.name}</span>
            {isPeakDay && (
              <Chip
                label="PEAK DAY"
                size="small"
                sx={{
                  height: '16px',
                  fontSize: '10px',
                  color: 'white',
                  bgcolor: data.color,
                  fontWeight: 'bold',
                  ml: 1
                }}
              />
            )}
          </div>

          <div style={{
            fontSize: '20px',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'baseline'
          }}>
            {formatNumber(requestCount)}
            <span style={{ fontSize: '14px', color: '#666', marginLeft: '4px' }}>requests</span>
          </div>

          {/* Percentage visualization */}
          <div style={{ marginBottom: '10px' }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '4px'
            }}>
              <div style={{ fontSize: '12px', color: '#666' }}>
                Percentage of weekly total:
              </div>
              <div style={{
                fontSize: '14px',
                fontWeight: 'bold',
                color: data.color,
                display: 'flex',
                alignItems: 'center'
              }}>
                <PercentIcon sx={{ fontSize: 14, mr: 0.5 }} />
                {percentage.toFixed(1)}%
              </div>
            </div>

            {/* Progress bar */}
            <div style={{
              height: '6px',
              width: '100%',
              backgroundColor: '#f0f0f0',
              borderRadius: '3px',
              overflow: 'hidden'
            }}>
              <div style={{
                height: '100%',
                width: `${percentage}%`,
                backgroundColor: data.color,
                borderRadius: '3px'
              }} />
            </div>

            {/* Weekly context */}
            <div style={{
              fontSize: '11px',
              color: '#777',
              textAlign: 'right',
              marginTop: '4px'
            }}>
              {requestCount} of {formatNumber(totalWeeklyRequests)} weekly requests
            </div>
          </div>

          {/* Additional context */}
          {isPeakDay && (
            <div style={{
              fontSize: '11px',
              backgroundColor: `${data.color}10`,
              padding: '4px 8px',
              borderRadius: '4px',
              marginTop: '6px',
              color: '#555'
            }}>
              <strong style={{ color: data.color }}>Insight:</strong> This is the busiest day of the week. Consider scheduling additional staff.
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  // Format percentage for display
  const formatPercentage = (value) => {
    if (!value) return '0%';
    return `${parseFloat(value).toFixed(1)}%`;
  };

  return (
    <Paper elevation={3} className="chart-container" style={{
      padding: '24px',
      borderRadius: '14px',
      marginBottom: '28px',
      background: 'linear-gradient(to bottom, #ffffff, #fafafa)'
    }}>
      {/* Header section with highlights */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Typography variant="h6" component="h2" style={{
            fontWeight: '700',
            color: '#333',
            borderBottom: `3px solid ${mainColor}`,
            paddingBottom: '8px',
            marginBottom: '12px',
            display: 'inline-block'
          }}>
            {title}
          </Typography>

          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            Analysis of request patterns to optimize staffing and resource allocation
          </Typography>

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
            <Chip
              icon={<TrendingUpIcon />}
              label={`${data.length} Total Requests`}
              variant="outlined"
              size="small"
              sx={{ border: `1px solid ${mainColor}40`, color: '#555' }}
            />
            <Chip
              icon={<CalendarTodayIcon fontSize="small" />}
              label={`${dateRange.startDate} - ${dateRange.endDate}`}
              size="small"
              variant="outlined"
              sx={{ border: '1px solid #ccd', color: '#667' }}
            />
          </Box>
        </Grid>

        {/* Highlight cards */}
        <Grid item xs={12} md={8}>
          <Grid container spacing={2}>
            {/* Peak Day Card */}
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{
                p: 2,
                height: '100%',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f8fdff 0%, #f0f7ff 100%)',
                border: '1px solid rgba(25, 118, 210, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60px',
                  height: '60px',
                  background: `${mainColor}15`,
                  borderRadius: '0 0 0 60px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  p: 1,
                }}>
                  <DateRangeIcon sx={{ color: mainColor, fontSize: 22 }} />
                </Box>

                <Typography variant="subtitle2" sx={{
                  color: '#555',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  mb: 1
                }}>
                  PEAK DAY
                </Typography>

                <Typography variant="h5" sx={{
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  mb: 0.5
                }}>
                  {peakDays[0]?.name || 'N/A'}
                </Typography>

                <Typography variant="body2" sx={{
                  color: mainColor,
                  fontWeight: 'bold'
                }}>
                  {formatNumber(peakDayCount)} requests
                </Typography>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1.5,
                  backgroundColor: `${mainColor}15`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5
                }}>
                  <PercentIcon sx={{ fontSize: 16, color: mainColor, mr: 0.5 }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    color: mainColor
                  }}>
                    {peakDays[0]?.percentage || 0}% of weekly total
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Peak Hour Card */}
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{
                p: 2,
                height: '100%',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #fff8f0 0%, #fff2e6 100%)',
                border: '1px solid rgba(255, 112, 67, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60px',
                  height: '60px',
                  background: `${CHART_COLORS.accent.orange}15`,
                  borderRadius: '0 0 0 60px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  p: 1,
                }}>
                  <AccessTimeIcon sx={{ color: CHART_COLORS.accent.orange, fontSize: 22 }} />
                </Box>

                <Typography variant="subtitle2" sx={{
                  color: '#555',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  mb: 1
                }}>
                  PEAK HOUR
                </Typography>

                <Typography variant="h5" sx={{
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  mb: 0.5
                }}>
                  {peakHours[0]?.displayHourFormatted || 'N/A'}
                </Typography>

                <Typography variant="body2" sx={{
                  color: CHART_COLORS.accent.orange,
                  fontWeight: 'bold'
                }}>
                  {formatNumber(peakHourCount)} requests
                </Typography>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1.5,
                  backgroundColor: `${CHART_COLORS.accent.orange}15`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5
                }}>
                  <AccessTimeIcon sx={{ fontSize: 16, color: CHART_COLORS.accent.orange, mr: 0.5 }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    color: CHART_COLORS.accent.orange
                  }}>
                    Hour {peakHours[0]?.hour}:00 - {(peakHours[0]?.hour + 1) % 24}:00
                  </Typography>
                </Box>
              </Paper>
            </Grid>

            {/* Busiest Period Card */}
            <Grid item xs={12} sm={4}>
              <Paper elevation={2} sx={{
                p: 2,
                height: '100%',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #f7f7ff 0%, #f0f0ff 100%)',
                border: '1px solid rgba(121, 134, 203, 0.15)',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <Box sx={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: '60px',
                  height: '60px',
                  background: `${CHART_COLORS.accent.indigo}15`,
                  borderRadius: '0 0 0 60px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'flex-end',
                  p: 1,
                }}>
                  <TrendingUpIcon sx={{ color: CHART_COLORS.accent.indigo, fontSize: 22 }} />
                </Box>

                <Typography variant="subtitle2" sx={{
                  color: '#555',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  mb: 1
                }}>
                  BUSIEST PERIOD
                </Typography>

                <Typography variant="h5" sx={{
                  fontWeight: 'bold',
                  color: '#1a1a1a',
                  mb: 0.5
                }}>
                  {busiestCategory.name || 'N/A'}
                </Typography>

                <Typography variant="body2" sx={{
                  color: CHART_COLORS.accent.indigo,
                  fontWeight: 'bold'
                }}>
                  {formatNumber(busiestCategory.count)} requests
                </Typography>

                <Box sx={{
                  display: 'flex',
                  alignItems: 'center',
                  mt: 1.5,
                  backgroundColor: `${CHART_COLORS.accent.indigo}15`,
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 5
                }}>
                  <PercentIcon sx={{ fontSize: 16, color: CHART_COLORS.accent.indigo, mr: 0.5 }} />
                  <Typography variant="caption" sx={{
                    fontWeight: 'bold',
                    color: CHART_COLORS.accent.indigo
                  }}>
                    {formatPercentage(busiestCategory.percentage)} of daily total
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Divider sx={{ my: 3 }} />

      {/* Chart Type Selector */}
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center' }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="chart-type-selector-label">Chart Type</InputLabel>
          <Select
            labelId="chart-type-selector-label"
            id="chart-type-selector"
            value={chartType}
            label="Chart Type"
            onChange={handleChartTypeChange}
            size="small"
            startAdornment={
              chartType === 'distribution' ?
                <BarChartIcon fontSize="small" sx={{ mr: 1, color: mainColor }} /> :
                <TimelineIcon fontSize="small" sx={{ mr: 1, color: mainColor }} />
            }
          >
            <MenuItem value="distribution">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <BarChartIcon fontSize="small" sx={{ mr: 1 }} />
                Daily Distribution
              </Box>
            </MenuItem>
            <MenuItem value="trends">
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TimelineIcon fontSize="small" sx={{ mr: 1 }} />
                Daily Trends
              </Box>
            </MenuItem>
          </Select>
        </FormControl>

        {/* Date Range Display */}
        <Box sx={{ ml: 2, display: 'flex', alignItems: 'center' }}>
          <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: '#666' }} />
          <Typography variant="caption" sx={{ color: '#666' }}>
            Data period: <strong>{dateRange.startDate}</strong> to <strong>{dateRange.endDate}</strong>
          </Typography>
        </Box>
      </Box>

      {/* Main visualization section */}
      <Grid container spacing={3}>
        {/* Chart visualization based on selected type */}
        {chartType === 'distribution' ? (
          /* Day of Week Chart */
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Daily Distribution
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Number of requests by day of week
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                <CalendarTodayIcon fontSize="inherit" /> Data period: {dateRange.startDate} to {dateRange.endDate}
              </Typography>

              <Box sx={{ height: 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={dailyData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  >
                    <defs>
                      {dailyData.map((entry, index) => (
                        <linearGradient
                          id={`dayGradient${index}`}
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                          key={`gradient-day-${index}`}
                        >
                          <stop
                            offset="0%"
                            stopColor={entry.count === peakDayCount ? mainColor : `${entry.color}`}
                            stopOpacity={0.8}
                          />
                          <stop
                            offset="95%"
                            stopColor={entry.count === peakDayCount ? mainColor : `${entry.color}`}
                            stopOpacity={0.2}
                          />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis
                      dataKey="shortName"
                      interval={0}
                      tick={{ fill: '#555', fontSize: 12 }}
                      axisLine={{ stroke: '#ddd' }}
                      tickLine={{ stroke: '#ddd' }}
                    />
                    <YAxis
                      tick={{ fill: '#555', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />

                    {/* Use custom tooltip for daily data */}
                    <Tooltip content={<CustomDailyTooltip />} />

                    {/* Area for better visual effect */}
                    <Area
                      type="monotone"
                      dataKey="count"
                      fill="url(#dayGradient0)"
                      stroke="none"
                      fillOpacity={0.1}
                    />

                    {/* Bars for count */}
                    <Bar
                      dataKey="count"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={40}
                    >
                      {dailyData.map((entry, index) => (
                        <Cell
                          key={`cell-day-${index}`}
                          fill={`url(#dayGradient${index})`}
                          stroke={entry.count === peakDayCount ? mainColor : entry.color}
                          strokeWidth={entry.count === peakDayCount ? 2 : 1}
                          style={{
                            filter: entry.count === peakDayCount ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))' : 'none'
                          }}
                        />
                      ))}
                      <LabelList
                        dataKey="count"
                        position="top"
                        style={{
                          fontSize: '16px',
                          fill: '#222',
                          fontWeight: 'bold',
                          stroke: '#fff',
                          strokeWidth: 3,
                          paintOrder: 'stroke'
                        }}
                      />
                    </Bar>
                    {/* Reference line for average */}
                    <ReferenceLine
                      y={dailyData.reduce((sum, item) => sum + item.count, 0) / 7}
                      stroke="#666"
                      strokeDasharray="3 3"
                      label={{
                        value: "Average",
                        position: "insideBottomRight",
                        fill: "#666",
                        fontSize: 11
                      }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>

              {/* Weekly distribution insights */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: `${mainColor}08`,
                  border: `1px solid ${mainColor}30`,
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <Box sx={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  backgroundColor: 'white',
                  px: 1,
                  color: mainColor,
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  WEEKLY DISTRIBUTION INSIGHT
                </Box>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      <strong style={{ color: mainColor }}>{peakDays[0]?.name || 'N/A'}</strong> has the highest volume with <strong>{formatNumber(peakDayCount)}</strong> requests, representing <strong>{peakDays[0]?.percentage}%</strong> of weekly total.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>Weekly distribution</Typography>
                        <Typography variant="caption" sx={{ color: mainColor, fontWeight: 'bold' }}>
                          {peakDays[0]?.percentage}%
                        </Typography>
                      </Box>

                      <Box sx={{
                        width: '100%',
                        height: '6px',
                        bgcolor: '#e0e0e0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <Box
                          sx={{
                            width: `${peakDays[0]?.percentage}%`,
                            height: '100%',
                            bgcolor: mainColor,
                            borderRadius: '3px'
                          }}
                        />
                      </Box>

                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          {formatNumber(peakDayCount)} of {formatNumber(totalWeeklyRequests)} requests
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        ) : (
          /* Daily Trends Chart */
          <Grid item xs={12} md={6}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
                Daily Trends
              </Typography>
              <Typography variant="caption" sx={{ color: '#666' }}>
                Number of requests over time
              </Typography>
              <Typography variant="caption" sx={{ color: '#666', display: 'block' }}>
                <CalendarTodayIcon fontSize="inherit" /> Data period: {dateRange.startDate} to {dateRange.endDate}
              </Typography>

              <Box sx={{ height: 300, mt: 1 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart
                    data={trendsData}
                    margin={{ top: 20, right: 20, left: 20, bottom: 40 }}
                  >
                    <defs>
                      <linearGradient id="trendsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={mainColor} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={mainColor} stopOpacity={0.1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                    <XAxis
                      dataKey="displayDate"
                      interval={Math.ceil(trendsData.length / 10)}
                      tick={{ fill: '#555', fontSize: 11 }}
                      angle={-45}
                      textAnchor="end"
                      height={60}
                      axisLine={{ stroke: '#ddd' }}
                      tickLine={{ stroke: '#ddd' }}
                    />
                    <YAxis
                      tick={{ fill: '#555', fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value, name, props) => {
                        if (name === 'count') {
                          return [`${formatNumber(value)} requests`, `Date: ${props.payload.date}`];
                        } else if (name === 'movingAvg') {
                          return [`${value}`, '7-day Average'];
                        } else if (name === 'trend') {
                          const sign = value > 0 ? '+' : '';
                          return [`${sign}${value}`, 'Daily Change'];
                        }
                        return [value, name];
                      }}
                      contentStyle={{
                        borderRadius: '8px',
                        padding: '12px',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                        border: 'none'
                      }}
                      labelStyle={{ fontWeight: 'bold', marginBottom: '5px' }}
                    />

                    {/* Area for better visual effect */}
                    <Area
                      type="monotone"
                      dataKey="count"
                      fill="url(#trendsGradient)"
                      stroke={mainColor}
                      strokeWidth={2}
                      fillOpacity={0.2}
                      dot={{ fill: mainColor, strokeWidth: 2, r: 1, stroke: mainColor }}
                      activeDot={{ r: 5, stroke: mainColor, strokeWidth: 1 }}
                    />

                    {/* Moving average line */}
                    <Line
                      type="monotone"
                      dataKey="movingAvg"
                      stroke="#ff7043"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={false}
                      activeDot={{ r: 4, fill: "#fff", stroke: "#ff7043", strokeWidth: 2 }}
                    />

                    {/* Reference line for average */}
                    <ReferenceLine
                      y={avgDailyRequests}
                      stroke="#666"
                      strokeDasharray="3 3"
                      label={{
                        value: "Overall Average",
                        position: "insideBottomRight",
                        fill: "#666",
                        fontSize: 11
                      }}
                    />

                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={36}
                      iconType="circle"
                      iconSize={8}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </Box>

              {/* Trends highlight */}
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: `${mainColor}08`,
                  border: `1px solid ${mainColor}30`,
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <Box sx={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  backgroundColor: 'white',
                  px: 1,
                  color: mainColor,
                  fontWeight: 'bold',
                  fontSize: '0.75rem'
                }}>
                  TREND INSIGHT
                </Box>

                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={7}>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      Peak daily volume occurred on <strong style={{ color: mainColor }}>{peakTrendDay.displayDate || 'N/A'}</strong> with <strong>{formatNumber(peakTrendDay.count)}</strong> requests.
                      Daily average is <strong>{avgDailyRequests}</strong> requests across {trendsData.length} days.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-around',
                      py: 1
                    }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Peak Volume
                        </Typography>
                        <Typography variant="h6" sx={{ color: mainColor, fontWeight: 'bold' }}>
                          {formatNumber(peakTrendDay.count)}
                        </Typography>
                      </Box>

                      <Divider orientation="vertical" flexItem sx={{ mx: 2 }} />

                      <Box sx={{ textAlign: 'center' }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Daily Average
                        </Typography>
                        <Typography variant="h6" sx={{ color: '#555', fontWeight: 'bold' }}>
                          {avgDailyRequests}
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          </Grid>
        )}

        {/* Hour of Day Chart with filters - Always show this */}
        <Grid item xs={12} md={6}>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Hourly Distribution
              </Typography>

              {/* Hourly chart filters */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <ToggleButtonGroup
                  value={hourlyFilterType}
                  exclusive
                  onChange={handleHourlyFilterChange}
                  size="small"
                  aria-label="hourly data filter"
                >
                  <ToggleButton value="daily" aria-label="daily view">
                    <TodayIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Daily
                  </ToggleButton>
                  <ToggleButton value="weekly" aria-label="weekly view">
                    <ViewWeekIcon fontSize="small" sx={{ mr: 0.5 }} />
                    Weekly
                  </ToggleButton>
                </ToggleButtonGroup>

                {/* Simple Date Selector */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <IconButton size="small" onClick={handlePrevDay} sx={{ color: '#666' }}>
                    <KeyboardArrowLeftIcon />
                  </IconButton>

                  <Box
                    sx={{
                      cursor: 'pointer',
                      px: 1,
                      py: 0.5,
                      border: '1px solid #ddd',
                      borderRadius: 1,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': { borderColor: mainColor }
                    }}
                    onClick={handleOpenDateMenu}
                  >
                    <CalendarTodayIcon fontSize="small" sx={{ mr: 1, color: mainColor }} />
                    {formatFullDateForDisplay(selectedDate)}
                  </Box>

                  <IconButton size="small" onClick={handleNextDay} sx={{ color: '#666' }}>
                    <KeyboardArrowRightIcon />
                  </IconButton>

                  {/* Date Picker Menu */}
                  <Menu
                    anchorEl={dateMenuAnchor}
                    open={Boolean(dateMenuAnchor)}
                    onClose={handleCloseDateMenu}
                    PaperProps={{
                      sx: { width: '300px', p: 1, maxHeight: '400px' }
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 1 }}>
                      <IconButton size="small" onClick={handlePrevMonth}>
                        <KeyboardArrowLeftIcon />
                      </IconButton>

                      <Typography variant="subtitle2">
                        {monthNames[displayedMonth.getMonth()]} {displayedMonth.getFullYear()}
                      </Typography>

                      <IconButton size="small" onClick={handleNextMonth}>
                        <KeyboardArrowRightIcon />
                      </IconButton>
                    </Box>

                    {/* Weekday headers */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mt: 1 }}>
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <Box
                          key={day}
                          sx={{
                            textAlign: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            color: '#666'
                          }}
                        >
                          {day}
                        </Box>
                      ))}
                    </Box>

                    {/* Calendar grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, mt: 1 }}>
                      {generateDaysGrid().map((day, index) => (
                        <Box
                          key={index}
                          onClick={() => handleDateSelect(day.date)}
                          sx={{
                            width: '32px',
                            height: '32px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            borderRadius: '50%',
                            opacity: day.isCurrentMonth ? 1 : 0.5,
                            backgroundColor: day.isSelected ? mainColor : day.isToday ? '#f0f0f0' : 'transparent',
                            color: day.isSelected ? 'white' : 'inherit',
                            '&:hover': {
                              backgroundColor: day.isSelected ? mainColor : '#e0e0e0'
                            }
                          }}
                        >
                          {day.date.getDate()}
                        </Box>
                      ))}
                    </Box>

                    {/* Today button */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Chip
                        label="Today"
                        size="small"
                        onClick={handleTodayClick}
                        sx={{ '&:hover': { bgcolor: '#e0e0e0' } }}
                      />
                    </Box>
                  </Menu>
                </Box>
              </Box>
            </Box>

            <Typography variant="caption" sx={{ color: '#666' }}>
              Number of requests by hour of day
            </Typography>

            <Typography variant="caption" sx={{ color: '#666', display: 'block', fontWeight: '600' }}>
              <CalendarTodayIcon fontSize="inherit" />
              {hourlyFilterType === 'daily' ? 'Showing data for: ' : 'Showing week of: '}
              <span style={{ color: mainColor }}>{getDateFilterDisplayText()}</span>
            </Typography>

            <Box sx={{ height: 300, mt: 1 }}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart
                  data={filteredHourlyData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                >
                  <defs>
                    <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e0e0e0" />
                  <XAxis
                    dataKey="displayHour"
                    interval={1}
                    tick={{ fill: '#555', fontSize: 10 }}
                    angle={-30}
                    textAnchor="end"
                    height={50}
                    axisLine={{ stroke: '#ddd' }}
                    tickLine={{ stroke: '#ddd' }}
                  />
                  <YAxis
                    tick={{ fill: '#555', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />

                  {/* Custom tooltip using the component we defined */}
                  <Tooltip content={<CustomHourlyTooltip />} />

                  {/* Area for visual effect */}
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="none"
                    fillOpacity={0.1}
                    fill="url(#hourlyGradient)"
                  />

                  {/* Bars for hour counts */}
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    maxBarSize={15}
                  >
                    {filteredHourlyData.map((entry, index) => (
                      <Cell
                        key={`cell-hour-${index}`}
                        fill={entry.count === peakHourCount && peakHourCount > 0 ? CHART_COLORS.accent.orange : entry.color}
                        stroke={entry.count === peakHourCount && peakHourCount > 0 ? CHART_COLORS.accent.orange : entry.color}
                        strokeWidth={entry.count === peakHourCount && peakHourCount > 0 ? 2 : 1}
                        style={{
                          filter: entry.count === peakHourCount && peakHourCount > 0 ? 'drop-shadow(0px 2px 3px rgba(0,0,0,0.1))' : 'none'
                        }}
                      />
                    ))}
                    <LabelList
                      dataKey="count"
                      position="top"
                      style={{ fontSize: '10px', fill: '#333', fontWeight: 600 }}
                      formatter={(value) => value > 0 ? value : ''}
                    />
                  </Bar>
                </ComposedChart>
              </ResponsiveContainer>
            </Box>

            {/* Peak hour highlight */}
            {peakHourCount > 0 ? (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: `${CHART_COLORS.accent.orange}08`,
                  border: `1px solid ${CHART_COLORS.accent.orange}30`,
                  borderRadius: '8px',
                  position: 'relative'
                }}
              >
                <Box sx={{
                  position: 'absolute',
                  top: -10,
                  left: 16,
                  backgroundColor: 'white',
                  px: 1,
                  color: CHART_COLORS.accent.orange,
                  fontWeight:'normal',
                  fontSize: '0.75rem'
                }}>
                  HOURLY INSIGHT
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={7}>
                    <Typography variant="body2" sx={{ color: '#555' }}>
                      Peak activity occurs at <strong style={{ color: CHART_COLORS.accent.orange }}>{peakHours[0]?.displayHourFormatted || 'N/A'}</strong> with <strong>{peakHourCount}</strong> requests.
                      Consider scheduling more staff during the <strong>{peakHours[0]?.timeCategory}</strong> period.
                    </Typography>
                  </Grid>

                  <Grid item xs={12} md={5}>
                    <Box sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      px: 1
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <AccessTimeIcon sx={{ fontSize: 16, color: CHART_COLORS.accent.orange, mr: 1 }} />
                        <Typography variant="body2" sx={{ color: '#555', fontWeight: 'bold' }}>
                          Hour {peakHours[0]?.hour}:00 - {(peakHours[0]?.hour + 1) % 24}:00
                        </Typography>
                      </Box>

                      <Box sx={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: `${CHART_COLORS.accent.orange}15`,
                        px: 1.5,
                        py: 0.5,
                        borderRadius: 1
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: CHART_COLORS.accent.orange }}>
                          {peakHours[0]?.timeCategory} period
                        </Typography>
                      </Box>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Box
                sx={{
                  mt: 2,
                  p: 2,
                  backgroundColor: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '8px'
                }}
              >
                <Typography variant="body2" sx={{ color: '#555', fontStyle: 'italic', textAlign: 'center' }}>
                  No request data available for the selected time period.
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Time Category Distribution */}
        <Grid item xs={12}>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, display: 'flex', alignItems: 'center' }}>
            <AccessTimeIcon sx={{ mr: 1, color: mainColor }} />
            Request Distribution by Time of Day
          </Typography>
          <Typography variant="caption" sx={{ color: '#666', display: 'block', mb: 2 }}>
            <CalendarTodayIcon fontSize="inherit" />
            {hourlyFilterType === 'daily' ? 'Showing data for: ' : 'Showing week of: '}
            <span style={{ fontWeight: '600', color: mainColor }}>{getDateFilterDisplayText()}</span>
          </Typography>

          <Grid container spacing={2} alignItems="stretch">
            {hourlyTimelineData.map((category, index) => (
              <Grid item xs={12} sm={6} md={3} key={`time-category-${index}`}>
                <Paper
                  elevation={1}
                  sx={{
                    borderRadius: '10px',
                    height: '100%',
                    overflow: 'hidden',
                    border: `1px solid ${category.color}40`,
                    backgroundColor: `${category.color}08`
                  }}
                >
                  <Box sx={{ p: 2 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        color: category.color,
                        fontWeight: 600,
                        mb: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{category.category}</span>
                      {category.category === busiestCategory.name && (
                        <Chip
                          label="BUSIEST"
                          size="small"
                          sx={{
                            height: '16px',
                            fontSize: '10px',
                            color: 'white',
                            bgcolor: category.color,
                            fontWeight: 'bold'
                          }}
                        />
                      )}
                    </Typography>

                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 'bold',
                        color: '#333',
                        mb: 0
                      }}
                    >
                      {formatNumber(category.count)}
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          fontWeight: 400,
                          color: '#777',
                          ml: 1
                        }}
                      >
                        requests
                      </Typography>
                    </Typography>

                    <Box sx={{ mt: 2 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: '#666' }}>
                          Distribution
                        </Typography>
                        <Typography variant="caption" sx={{ color: category.color, fontWeight: 'bold' }}>
                          {formatPercentage(category.percentage)}
                        </Typography>
                      </Box>

                      <Box sx={{
                        width: '100%',
                        height: '6px',
                        bgcolor: '#e0e0e0',
                        borderRadius: '3px',
                        overflow: 'hidden'
                      }}>
                        <Box
                          sx={{
                            width: `${category.percentage}%`,
                            height: '100%',
                            bgcolor: category.color,
                            borderRadius: '3px'
                          }}
                        />
                      </Box>
                    </Box>

                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2
                    }}>
                      <Typography variant="caption" sx={{ color: '#666' }}>
                        Peak Hour
                      </Typography>

                      <Chip
                        label={`${category.peakHour}`}
                        size="small"
                        sx={{
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                          fontWeight: 600,
                          fontSize: '0.7rem'
                        }}
                      />
                    </Box>
                  </Box>

                  {/* Visual indicator bar */}
                  <Box sx={{
                    height: '4px',
                    width: '100%',
                    backgroundColor: category.color,
                    opacity: category.category === busiestCategory.name ? 1 : 0.5
                  }} />
                </Paper>
              </Grid>
            ))}
          </Grid>

          <Box sx={{
            mt: 3,
            p: 1.5,
            textAlign: 'right',
            borderTop: '1px dashed #ddd',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <Typography variant="caption" sx={{ color: '#777', fontStyle: 'italic' }}>
              Note: Times shown are in 24-hour format based on the local timezone.
            </Typography>

            <Typography variant="caption" sx={{ color: '#777' }}>
              Data current as of {currentDateTime} • Generated by {currentUser}
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default RequestDistributionChart;