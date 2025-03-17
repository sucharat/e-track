import React, { useState, useEffect, useRef } from "react";
import './CustomPicker.css';
import { FormControl, RadioGroup, FormControlLabel, Radio, Button, TextField, InputAdornment, Paper } from '@mui/material';
import DateRangeIcon from '@mui/icons-material/DateRange';
import FilterListIcon from '@mui/icons-material/FilterList';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';

const DateRangePicker = ({ onDateChange }) => {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterType, setFilterType] = useState("custom"); // custom, month, year
  const [showFilters, setShowFilters] = useState(false);
  const wrapperRef = useRef(null);

  // Handle click outside to close the date picker dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setShowFilters(false);
      }
    }
    // Add event listener when the filters are shown
    if (showFilters) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    // Cleanup the event listener
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showFilters]);

  const handleApply = () => {
    onDateChange({
      type: filterType,
      startDate,
      endDate,
    });
    setShowFilters(false);
  };

  const handleFilterTypeChange = (event) => {
    const type = event.target.value;
    setFilterType(type);
    
    // Reset dates when changing filter type
    if (type === "month") {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      setStartDate(`${year}-${month}-01`);
      
      // Calculate last day of the month
      const lastDay = new Date(year, today.getMonth() + 1, 0).getDate();
      setEndDate(`${year}-${month}-${lastDay}`);
    } else if (type === "year") {
      const year = new Date().getFullYear();
      setStartDate(`${year}-01-01`);
      setEndDate(`${year}-12-31`);
    } else {
      // For custom, clear the fields
      setStartDate("");
      setEndDate("");
    }
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Format range for display
  const getDisplayRange = () => {
    if (!startDate && !endDate) return "Select date range";
    
    if (filterType === "month") {
      const date = new Date(startDate);
      return date.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    
    if (filterType === "year") {
      return startDate.substring(0, 4);
    }
    
    // Custom range
    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString();
      const end = new Date(endDate).toLocaleDateString();
      return `${start} - ${end}`;
    }
    
    return "Incomplete range";
  };

  return (
    <div className="enhanced-date-range-picker" ref={wrapperRef}>
      <Button 
        variant="outlined" 
        onClick={toggleFilters}
        className="date-picker-toggle-btn"
        startIcon={<DateRangeIcon />}
        size="medium"
      >
        {startDate && endDate ? getDisplayRange() : "Select Date Range"}
      </Button>
      
      {showFilters && (
        <Paper elevation={3} className="date-filter-panel">
          <h3 className="filter-panel-title">
            <FilterListIcon fontSize="small" /> Date Range Selection
          </h3>
          
          <FormControl component="fieldset" className="filter-type-control">
            <RadioGroup 
              row 
              name="filterType" 
              value={filterType} 
              onChange={handleFilterTypeChange}
              className="filter-type-radio-group"
            >
              <FormControlLabel 
                value="custom" 
                control={<Radio color="primary" />} 
                label="Custom Range" 
                className="filter-type-option"
              />
              <FormControlLabel 
                value="month" 
                control={<Radio color="primary" />} 
                label="Monthly" 
                className="filter-type-option"
              />
              <FormControlLabel 
                value="year" 
                control={<Radio color="primary" />} 
                label="Yearly" 
                className="filter-type-option"
              />
            </RadioGroup>
          </FormControl>

          <div className="date-inputs-container">
            {filterType === "custom" && (
              <div className="date-inputs custom-inputs">
                <TextField
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  className="date-input"
                />
                <TextField
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarTodayIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  className="date-input"
                />
              </div>
            )}
            
            {filterType === "month" && (
              <div className="date-inputs month-inputs">
                <TextField
                  label="Select Month"
                  type="month"
                  value={startDate.substring(0, 7)}
                  onChange={(e) => {
                    const monthVal = e.target.value;
                    const year = monthVal.split("-")[0];
                    const month = monthVal.split("-")[1];
                    // Set start date to first day of month
                    setStartDate(`${year}-${month}-01`);
                    // Set end date to last day of month
                    const lastDay = new Date(year, parseInt(month), 0).getDate();
                    setEndDate(`${year}-${month}-${lastDay}`);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CalendarMonthIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  className="date-input month-input"
                />
              </div>
            )}
            
            {filterType === "year" && (
              <div className="date-inputs year-inputs">
                <TextField
                  label="Select Year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={startDate.substring(0, 4) || new Date().getFullYear()}
                  onChange={(e) => {
                    const year = e.target.value;
                    setStartDate(`${year}-01-01`);
                    setEndDate(`${year}-12-31`);
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateRangeIcon fontSize="small" color="action" />
                      </InputAdornment>
                    ),
                  }}
                  className="date-input year-input"
                />
              </div>
            )}
          </div>
          
          <div className="date-filter-actions">
            <Button 
              variant="outlined" 
              onClick={() => setShowFilters(false)}
              className="cancel-btn"
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              color="primary"
              onClick={handleApply}
              className="apply-btn"
              disabled={!startDate || !endDate}
            >
              Apply Filter
            </Button>
          </div>
        </Paper>
      )}
    </div>
  );
};

export default DateRangePicker;