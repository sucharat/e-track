import React from 'react';

const DashboardHeader = ({ username, dateTime }) => {
  return (
    <div className="manager-header">
      <div className="header-left">
        <h1 className="dashboard-title">E-TRACK Management Dashboard</h1>
      </div>
      {/* <div className="header-right">
        <div className="current-time">{dateTime}</div>
      </div> */}
    </div>
  );
};

export default DashboardHeader;