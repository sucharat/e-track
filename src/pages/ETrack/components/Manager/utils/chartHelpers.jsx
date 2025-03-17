import React from 'react';

export const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="tooltip-time">{`Time: ${label}`}</p>
        <p className="tooltip-count">{`Requests: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export const CustomDailyHourlyTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    // Extract the date from the payload
    const date = payload[0]?.payload?.date;
    const hourLabel = payload[0]?.payload?.hourLabel;
    
    return (
      <div className="custom-tooltip">
        <p className="tooltip-date">{`Date: ${date}`}</p>
        <p className="tooltip-time">{`Time: ${hourLabel}`}</p>
        <p className="tooltip-count">{`Requests: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export const formatHourTick = (hour) => {
  return hour;
};