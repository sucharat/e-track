import React from 'react';

const DashboardFooter = ({ username }) => {
  return (
    <footer className="dashboard-footer">
      <div className="footer-info">
        <span className="system-info">E-TRACK Management System</span>
        <span className="user-session">User: {username}</span>
        <span className="current-datetime">Last refreshed: 2025-03-13 20:23:51</span>
      </div>
    </footer>
  );
};

export default DashboardFooter;