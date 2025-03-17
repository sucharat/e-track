// src/components/HeatMapCalendarContainer.js
import React from 'react';
import ChartContainer from "../ChartContainer";
import HeatMapCalendar from "./HeatMapCalendar";

const HeatMapCalendarContainer = ({
    title,
    data,
    startDate,
    endDate,
    currentUser,
    currentDateTime,
    selectedDataType
  }) => {
    return (
      <div className="heatmap-section" style={{ position: 'relative', zIndex: 1 }}> {/* เพิ่ม position และ z-index */}
        <div className="chart-container">
          <h3 className="chart-title">{title}</h3>
          <div className="heatmap-container" style={{ 
            overflow: 'visible',  // เพิ่ม overflow: visible
            position: 'relative', // เพิ่ม position: relative
            minHeight: '200px'    // กำหนดความสูงขั้นต่ำ
          }}>
            <HeatMapCalendar
              data={data}
              startDate={startDate}
              endDate={endDate}
              currentUser={currentUser}
              currentDateTime={currentDateTime}
              selectedDataType={selectedDataType}
            />
            <div className="chart-timestamp" style={{
              textAlign: 'right',
              fontSize: '12px',
              color: '#999',
              padding: '5px 0'
            }}>
              Data current as of {currentDateTime} • User: {currentUser}
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default HeatMapCalendarContainer;