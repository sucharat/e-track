import React, { useState, useRef, useEffect } from 'react';
import { 
  FormControl, InputLabel, Select, MenuItem, Checkbox, ListItemText,
  OutlinedInput, Box, Chip, Button, Paper
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import DateRangePicker from "../DateRangePicker";

const ControlsRow = ({ 
  dateRange, 
  onDateChange, 
  chartOptions, 
  visibleCharts, 
  setVisibleCharts 
}) => {
  const [showChartSelector, setShowChartSelector] = useState(false);
  const chartSelectorRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (chartSelectorRef.current && !chartSelectorRef.current.contains(event.target)) {
        setShowChartSelector(false);
      }
    }

    if (showChartSelector) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showChartSelector]);

  const selectedCount = Object.values(visibleCharts).filter(Boolean).length;

  return (
    <div className="dashboard-controls-row">
      <div className="dashboard-controls-left">
        <DateRangePicker onDateChange={onDateChange} />
      </div>
      
      <div className="dashboard-controls-right" ref={chartSelectorRef}>
        <div className="chart-visibility-selector">
          <Button
            variant="outlined"
            onClick={() => setShowChartSelector(!showChartSelector)}
            startIcon={<FilterAltIcon fontSize="small" />}
            className="chart-selector-btn"
            size="medium"
          >
            Visible Charts
          </Button>
          
          {showChartSelector && (
            <Paper elevation={3} className="chart-selector-panel">
              <h3 className="selector-panel-title">
                <VisibilityIcon fontSize="small" /> Chart Visibility
              </h3>
              
              <div className="chart-options-list">
                {chartOptions.map((option) => (
                  <div key={option.value} className="chart-option-item">
                    <Checkbox 
                      checked={visibleCharts[option.value]} 
                      onChange={(e) => {
                        setVisibleCharts(prev => ({
                          ...prev,
                          [option.value]: e.target.checked
                        }));
                      }} />
                    <span className="chart-option-label">{option.label}</span>
                  </div>
                ))} </div>
              
              <div className="chart-selector-actions">
                <Button 
                  variant="outlined" 
                  color="secondary"
                  onClick={() => setShowChartSelector(false)}
                  className="cancel-btn"
                >
                  Close
                </Button>
              </div>
              
            </Paper>
          )}
        </div>
      </div>
    </div>
  );
};

export default ControlsRow;