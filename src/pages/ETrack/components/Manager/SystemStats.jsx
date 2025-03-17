import React from 'react';

const SystemStats = ({
  filteredRequests,
  filteredCoordRequests,
  filteredPendingEscortCount,
  filteredCompletedEscortCount,
  filteredPendingCoordCount,
  filteredCompletedCoordCount,
  filteredStaffSummary,
  filteredTranslatorSummary,
  calculateAverageResponseTime
}) => {
  return (
    <>
      <h2 className="section-title">System Statistics</h2>
      <div className="dashboard-charts">
        <div className="chart-container">
          <h2 className="chart-title">Active Request Status Overview</h2>
          <div className="multi-stat-container">
            <div className="stat-card">
              <div className="stat-value">{filteredRequests.length + filteredCoordRequests.length}</div>
              <div className="stat-label">Total Active Requests</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {filteredPendingEscortCount + filteredPendingCoordCount}
              </div>
              <div className="stat-label">Pending</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {filteredCompletedEscortCount + filteredCompletedCoordCount}
              </div>
              <div className="stat-label">Completed</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">
                {filteredStaffSummary.length + filteredTranslatorSummary.length}
              </div>
              <div className="stat-label">Active Staff</div>
            </div>
          </div>
          
          <div className="response-metrics">
            <h3>Average Response Times</h3>
            <div className="metrics-container">
              <div className="metric-item">
                <div className="metric-label">Patient Escort</div>
                <div className="metric-value">
                  {calculateAverageResponseTime(filteredRequests)}
                </div>
              </div>
              
              <div className="metric-item">
                <div className="metric-label">Translator</div>
                <div className="metric-value">
                  {calculateAverageResponseTime(filteredCoordRequests)}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SystemStats;