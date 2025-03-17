import React from 'react';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';
import ChartContainer from "../ChartContainer";
import SummaryTable from "../SummaryTable";

const SummarySection = ({
  selectedDataType,
  visibleCharts,
  filteredStaffSummary,
  filteredTranslatorSummary,
  dateRange,
  clearDateFilter,
  loading,
  currentDateTime,
  COLORS
}) => {
  if (selectedDataType === "patient_escort") {
    return (
      <div className="dashboard-section">

        {/* Staff Performance Chart */}
        <div className="dashboard-charts">
          {visibleCharts.completionRate && (
            <ChartContainer title="Staff Request Completion Rate">
              <BarChart
                data={filteredStaffSummary.map(staff => ({
                  name: staff.staffName.split(' ')[0],
                  completed: staff.finishedRequests,
                  pending: staff.pendingRequests
                }))} 
                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                < XAxis 
                  dataKey="name"
                  tick={{ angle: -45 }} 
                  height={60} 
                  textAnchor="end" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completed" name="Completed Requests" stackId="a" fill="#82ca9d" />
                <Bar dataKey="pending" name="Pending Requests" stackId="a" fill="#ffc658" />
              </BarChart>
            </ChartContainer>
          )}
        </div>

        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">Patient Escort Staff Summary</h3>
            <div className="filter-status">
              {dateRange.startDate && dateRange.endDate && (
                <div className="current-filter">
                  Showing data from {dateRange.startDate} to {dateRange.endDate}
                  <button className="clear-filter-btn" onClick={clearDateFilter}>
                    Clear Filter
                  </button>
                </div> )}
            </div>
          </div>
          <SummaryTable 
            tableType="escort" 
            data={filteredStaffSummary} 
            loading={loading} />
          <div className="data-timestamp">Last updated: {currentDateTime}</div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="dashboard-section">
      {/* Translator Performance Chart */}
      <div className="dashboard-charts">
        {visibleCharts.completionRate && (
          <ChartContainer title="Translator Request Completion Rate">
            <BarChart
              data={filteredTranslatorSummary.map(staff => ({
                name: staff.staffName.split(' ')[0],
                completed: staff.finishedRequests,
                pending: staff.pendingRequests,
                languages: staff.languages.split(',').length
              }))} 
              margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              < XAxis 
                dataKey="name"
                tick={{ angle: -45 }} 
                height={60} 
                textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" name="Completed Requests" stackId="a" fill="#82ca9d" />
              <Bar dataKey="pending" name="Pending Requests" stackId="a" fill="#ffc658" />
              <Line dataKey="languages" name="Languages" type="monotone" stroke="#ff7300" />
            </BarChart>
          </ChartContainer>
        )}
      </div>

      <div className="dashboard-panel">
        <div className="panel-header">
          <h3 className="panel-title">Translator Staff Summary</h3>
          <div className="filter-status">
            {dateRange.startDate && dateRange.endDate && (
              <div className="current-filter">
                Showing data from {dateRange.startDate} to {dateRange.endDate}
                <button className="clear-filter-btn" onClick={clearDateFilter}>
                  Clear Filter
                </button>
              </div>
            )}
          </div>
        </div>

        < SummaryTable 
          tableType="translator" 
          data={filteredTranslatorSummary} 
          loading={loading} />
        <div className="data-timestamp">Last updated: {currentDateTime}</div>
      </div>
    </div>
  );
};

export default SummarySection;