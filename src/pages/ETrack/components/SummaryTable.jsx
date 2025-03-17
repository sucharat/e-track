import React from "react";

const SummaryTable = ({ tableType, data = [], loading = false }) => {
  // Common rendering for no data or loading states
  if (loading) {
    return (
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              {tableType === "escort" ? (
                <>
                  <th>Staff Name</th>
                  <th>Total Requests</th>
                  <th>Pending / Finished</th>
                  <th>Departments</th>
                  <th>Equipment Used</th>
                  <th>Last Request</th>
                </>
              ) : (
                <>
                  <th>Staff Name</th>
                  <th>Total Requests</th>
                  <th>Pending / Finished</th>
                  <th>Languages</th>
                  <th>Departments</th>
                  <th>Last Request</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={tableType === "escort" ? 6 : 6} className="no-data">
                Loading data...
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="table-responsive">
        <table className="dashboard-table">
          <thead>
            <tr>
              {tableType === "escort" ? (
                <>
                  <th>Staff Name</th>
                  <th>Total Requests</th>
                  <th>Pending / Finished</th>
                  <th>Departments</th>
                  <th>Equipment Used</th>
                  <th>Last Request</th>
                </>
              ) : (
                <>
                  <th>Staff Name</th>
                  <th>Total Requests</th>
                  <th>Pending / Finished</th>
                  <th>Languages</th>
                  <th>Departments</th>
                  <th>Last Request</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={tableType === "escort" ? 6 : 6} className="no-data">
                No data available for the selected date range
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  // Different rendering based on table type
  return (
    <div className="table-responsive">
      <table className="dashboard-table">
        <thead>
          <tr>
            {tableType === "escort" ? (
              <>
                <th>Staff Name</th>
                <th>Total Requests</th>
                <th>Pending / Finished</th>
                <th>Departments</th>
                <th>Equipment Used</th>
                <th>Last Request</th>
              </>
            ) : (
              <>
                <th>Staff Name</th>
                <th>Total Requests</th>
                <th>Pending / Finished</th>
                <th>Languages</th>
                <th>Departments</th>
                <th>Last Request</th>
              </>
            )}
          </tr>
        </thead>
        <tbody>
          {tableType === "escort"
            ? data.map((staff) => (
                <tr key={staff.staffId}>
                  <td>
                    <div className="staff-info">
                      <span className="staff-name">{staff.staffName}</span>
                      <small className="staff-extension">
                        {staff.extension}
                      </small>
                    </div>
                  </td>
                  <td className="text-center">{staff.totalRequests}</td>
                  <td className="requests-status">
                    <span className="pending-count">{staff.pendingRequests}</span> /{" "}
                    <span className="finished-count">
                      {staff.finishedRequests}
                    </span>
                  </td>
                  <td>{staff.departments}</td>
                  <td>{staff.equipmentUsed || "None"}</td>
                  <td>{staff.lastRequestTime}</td>
                </tr>
              ))
            : data.map((staff) => (
                <tr key={staff.staffId}>
                  <td>
                    <div className="staff-info">
                      <span className="staff-name">{staff.staffName}</span>
                      <small className="staff-extension">
                        {staff.extension}
                      </small>
                    </div>
                  </td>
                  <td className="text-center">{staff.totalRequests}</td>
                  <td className="requests-status">
                    <span className="pending-count">{staff.pendingRequests}</span> /{" "}
                    <span className="finished-count">
                      {staff.finishedRequests}
                    </span>
                  </td>
                  <td>
                    <span className="language-tags">{staff.languages}</span>
                  </td>
                  <td>{staff.departments}</td>
                  <td>{staff.lastRequestTime}</td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
};

export default SummaryTable;