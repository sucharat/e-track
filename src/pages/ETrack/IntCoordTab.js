import IntCoordTabsModal from "./components/IntCoordTabModal";
import { useState, useEffect, useCallback } from "react";
import { url, getLocalData } from "../../helper/help";

const IntCoordTab = () => {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [translators, setTranslators] = useState([]);
  const [translatorOptions, setTranslatorOptions] = useState([]);
  const [departmentTrackers, setDepartmentTrackers] = useState([]);
  const [movingDepartmentId, setMovingDepartmentId] = useState(null);
  const [newDepartments, setNewDepartments] = useState({});

  // เปลี่ยนการเรียกใช้ localStorage 
  const storedEmpType = localStorage.getItem("empType");
  // Move these function declarations before any useEffect that depends on them
  const fetchTranslatorOptions = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetStaff?type=translator",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        const translatorData =
          typeof result === "string" ? JSON.parse(result) : result;
        console.log("Translator Options:", translatorData);

        setTranslatorOptions(translatorData);

        const uniqueTranslators = new Map();

        translatorData.forEach((translator) => {
          if (!uniqueTranslators.has(translator.eid)) {
            uniqueTranslators.set(translator.eid, {
              id: translator.eid,
              name: translator.full_name,
              languages: translator.lang || "Unknown",
              extension: translator.tel || "*0000",
              status:
                translator.is_free === "1" ? "Available" : "Not Available",
            });
          } else {
            const existingTranslator = uniqueTranslators.get(translator.eid);
            if (
              translator.lang &&
              !existingTranslator.languages.includes(translator.lang)
            ) {
              existingTranslator.languages += `, ${translator.lang}`;
            }
          }
        });

        setTranslators(Array.from(uniqueTranslators.values()));
      }
    } catch (error) {
      console.error("Error fetching translator options:", error);
    }
  }, []);

  const fetchDepartmentTrackerData = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(url + "/api/ETrack/OnGetEtrackRequest?Type=translator", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });
  
      if (response.ok) {
        const result = await response.json();
        const dataArray = typeof result === "string" ? JSON.parse(result) : result;
  
        const trackerData = dataArray.map((item) => {
          const lastMovedDateTime = item.last_update ? new Date(item.last_update) : new Date(`${item.request_date}T${item.request_time}`);
          const now = new Date();
          const timeDiffMs = now - lastMovedDateTime;
          const timeInDeptMinutes = Math.floor(timeDiffMs / (1000 * 60));
          const hours = Math.floor(timeInDeptMinutes / 60);
          const minutes = timeInDeptMinutes % 60;
          let timeInDeptFormatted = "Just arrived";
  
          if (timeInDeptMinutes > 0) {
            if (hours > 0) {
              timeInDeptFormatted = `${hours} hr${hours > 1 ? "s" : ""} ${minutes} min${minutes !== 1 ? "s" : ""}`;
            } else {
              timeInDeptFormatted = `${minutes} min${minutes !== 1 ? "s" : ""}`;
            }
          }
  
          return {
            id: item.request_id,
            role: "International Coordinator",
            name: item.staff_name || "Unknown",
            currentDept: item.base_service_point_id || "Unknown",
            timeInDept: timeInDeptFormatted,
            lastMovedTime: lastMovedDateTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            status: item.status,
          };
        });
  
        setDepartmentTrackers(trackerData.filter(tracker => tracker.status !== "cancelled" && tracker.status !== "finished" && tracker.status !== "completed"));
      }
    } catch (error) {
      console.error("Error fetching department tracker data:", error);
    }
  }, []);
  
  // Now use the functions in useEffect after they've been defined
  useEffect(() => {
    fetchRequests();
    fetchTranslatorOptions();
    fetchDepartmentTrackerData();
  }, [fetchTranslatorOptions, fetchDepartmentTrackerData]);

  const handleDepartmentChange = (id, value) => {
    setNewDepartments((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const updateDepartment = async (id) => {
    if (!id || !newDepartments[id]) {
      alert("Please select a department");
      return;
    }
  
    // Add confirmation prompt before proceeding
    const confirmUpdate = window.confirm("Are you sure you want to update the department?");
    if (!confirmUpdate) {
      return; // If the user cancels, exit the function without making any changes
    }
  
    try {
      setMovingDepartmentId(id);
      const token = getLocalData("token");
  
      const response = await fetch(
        `${url}/api/ETrack/OnUpdateETrack?id=${id}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            base_service_point_id: newDepartments[id],
          }),
        }
      );
  
      if (response.ok) {
        // Update the local state
        setDepartmentTrackers((prev) =>
          prev.map((tracker) =>
            tracker.id === id
              ? {
                  ...tracker,
                  currentDept: newDepartments[id],
                  timeInDept: "Just moved",
                  lastMovedTime: new Date().toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  }),
                }
              : tracker
          )
        );
        // Clear the selected department
        setNewDepartments((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });
  
        alert("Department updated successfully");
        // Refresh the data
        fetchDepartmentTrackerData();
      } else {
        alert("Failed to update department");
      }
    } catch (error) {
      console.error("Error updating department:", error);
      alert("Failed to update department: " + error.message);
    } finally {
      setMovingDepartmentId(null);
    }
  };

  const [escorts, setEscorts] = useState([
    {
      name: "นิคม วรรณเลิศอุดม",
      status: "available",
      currentTask: "None",
    },
    {
      name: "วิศว กิจผ่องแผ้ว",
      status: "occupied",
      currentTask: "None",
    },
    {
      name: "อภิชาติ เก้าเอี้ยน",
      status: "ontheway",
      currentTask: "Transporting Request 10001",
    },
  ]);

  const handleEscortStatusChange = (escortName) => {
    setEscorts((prevEscorts) => {
      return prevEscorts.map((escort) => {
        if (escort.name === escortName) {
          if (escort.status === "available") {
            const pendingRequest = requests.find(
              (req) => req.status === "pending"
            );
            return {
              ...escort,
              status: "ontheway",
              currentTask: pendingRequest
                ? `Transporting Request ${pendingRequest.id}`
                : "None",
            };
          } else if (escort.status === "ontheway") {
            return {
              ...escort,
              status: "occupied",
            };
          } else {
            return {
              ...escort,
              status: "available",
              currentTask: "None",
            };
          }
        }
        return escort;
      });
    });
  };

  const getActionButton = (status, name) => {
    switch (status) {
      case "available":
        return (
          <button
            className="btn btn-primary"
            onClick={() => handleEscortStatusChange(name)}
          >
            Assign Task
          </button>
        );

      case "ontheway":
        return (
          <button
            className="btn btn-warning"
            onClick={() => handleEscortStatusChange(name)}
          >
            Arrived
          </button>
        );

      case "occupied":
        return (
          <button
            className="btn btn-success"
            onClick={() => handleEscortStatusChange(name)}
          >
            Release
          </button>
        );
      default:
        return null;
    }
  };

  // ดึงข้อมุลผู้ป่วย ====
  const fetchRequests = async () => {
    try {
      var token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetEtrackRequest?Type=patient_escort",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );
      const iStatusCode = response.status;
      if (iStatusCode === 200) {
        const result = await response.json();
        var resBody = JSON.parse(result);
        console.log(resBody);
        setRequests(resBody);
      }
    } catch (error) {
      console.log(error);
    }
  };

  // This useEffect can be removed since we have the combined one above
  // useEffect(() => {
  //   fetchRequests();
  //   fetchTranslatorOptions();
  // }, [fetchTranslatorOptions]);

  const fetchRequestsData = useCallback(async () => {
    setLoading(true);
    try {
      const token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetEtrackRequest?Type=translator",
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();

        console.log("API Response Data Type:", typeof data);
        console.log("API Response is Array:", Array.isArray(data));

        const dataArray = Array.isArray(data)
          ? data
          : typeof data === "string"
          ? JSON.parse(data)
          : [];

        if (
          dataArray.length > 0 ||
          (typeof data === "object" && JSON.stringify(data).startsWith("["))
        ) {
          const itemsToProcess =
            dataArray.length > 0 ? dataArray : JSON.parse(JSON.stringify(data));

          const transformedData = itemsToProcess.map((item) => ({
            id: item.request_id,
            coordinatorName: item.staff_name || "Unknown",
            language: item.lang || "Unknown",
            extension: item.staff_tel || "*0000",
            department: item.detail || "Unknown",
            urgency: "Normal",
            status: item.status || "pending",

            patient_hn: item.patient_hn,
            base_service_point_id: item.base_service_point_id,
            request_date: item.request_date,
            request_time: item.request_time,
          }));
          setRequests(transformedData);
          updateDashboardMetrics(transformedData);
          updateTranslatorAvailability(transformedData);
        } else {
          console.error("Could not process API response as an array:", data);
        }
      } else {
        console.error(
          "Failed to fetch requests data. Status:",
          response.status
        );
      }
    } catch (error) {
      console.error("Error fetching requests data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTranslatorAvailability = useCallback(
    (requestsData) => {
      if (translatorOptions.length > 0) {
        const uniqueTranslators = new Map();

        translatorOptions.forEach((translator) => {
          if (!uniqueTranslators.has(translator.eid)) {
            uniqueTranslators.set(translator.eid, {
              id: translator.eid,
              name: translator.full_name,
              languages: translator.lang || "Unknown",
              extension: translator.tel || "*0000",
              status:
                translator.is_free === "1" ? "Available" : "Not Available",
              hasPendingRequest: false,
            });
          } else {
            const existingTranslator = uniqueTranslators.get(translator.eid);
            if (
              translator.lang &&
              !existingTranslator.languages.includes(translator.lang)
            ) {
              existingTranslator.languages += `, ${translator.lang}`;
            }
          }
        });

        requestsData.forEach((request) => {
          for (const [eid, translator] of uniqueTranslators.entries()) {
            if (translator.name === request.coordinatorName) {
              if (
                request.status.toLowerCase() === "pending" ||
                request.status.toLowerCase() === "created"
              ) {
                translator.hasPendingRequest = true;
                translator.status = "Not Available";
              }
              break;
            }
          }
        });

        const translatorsArray = Array.from(uniqueTranslators.values());
        setTranslators(translatorsArray);
      } else {
        const uniqueTranslators = new Map();

        requestsData.forEach((request) => {
          if (!request.coordinatorName || request.coordinatorName === "Unknown")
            return;

          if (!uniqueTranslators.has(request.coordinatorName)) {
            uniqueTranslators.set(request.coordinatorName, {
              id: request.id + "_" + request.coordinatorName,
              name: request.coordinatorName,
              languages: request.language || "Unknown",
              extension: request.extension || "*0000",
              status: "Available",
              hasPendingRequest: false,
            });
          }

          if (
            request.status.toLowerCase() === "pending" ||
            request.status.toLowerCase() === "created"
          ) {
            const translator = uniqueTranslators.get(request.coordinatorName);
            translator.hasPendingRequest = true;
            translator.status = "Not Available";
          }
        });

        const translatorsArray = Array.from(uniqueTranslators.values());
        setTranslators(translatorsArray);
      }
    },
    [translatorOptions]
  );

  useEffect(() => {
    fetchRequestsData();
  }, [fetchRequestsData]);

  const updateDashboardMetrics = (requestsData) => {
    const pendingRequests = requestsData.filter(
      (req) =>
        req.status.toLowerCase() === "pending" ||
        req.status.toLowerCase() === "created"
    ).length;
    const completedRequests = requestsData.filter(
      (req) =>
        req.status.toLowerCase() === "finished" ||
        req.status.toLowerCase() === "completed"
    ).length;
    const completionRate =
      requestsData.length > 0
        ? Math.round((completedRequests / requestsData.length) * 100)
        : 0;

    const pendingElement = document.getElementById("coordPendingRequests");
    const completedElement = document.getElementById("coordCompletedRequests");
    const completionRateElement = document.getElementById(
      "coordCompletionRate"
    );

    if (pendingElement) pendingElement.textContent = pendingRequests;
    if (completedElement) completedElement.textContent = completedRequests;
    if (completionRateElement)
      completionRateElement.textContent = `${completionRate} %`;
  };

  const handleSubmit = async (event, formData) => {
    try {
      event.preventDefault();
      console.log("Form Data Submitted:", formData);
  
      let selectedTranslator = null;
      if (formData.translatorId && translatorOptions.length > 0) {
        selectedTranslator = translatorOptions.find(
          (t) => t.eid === formData.translatorId
        );
      }
  
      if (!selectedTranslator) {
        console.warn("No translator selected or found. Using default values.");
        selectedTranslator = {
          eid: formData.translatorId || "1234",
          lang_id: formData.language === "German" ? "1" : "2",
          lang: formData.language || "German",
        };
      }
  
      const data = {
        type: "translator",
        staff_id: selectedTranslator.eid || formData.translatorId || "6234",
        patient_hn: formData.patientHN || "05-12-12345",
        base_service_point_id: formData.servicePointId || "OR1234",
        detail: formData.department || "Service Request",
        languages: [
          {
            lang_id: selectedTranslator.lang_id.toString() || "1",
          },
        ],
  
        req: "translator_request",
      };
  
      console.log("Sending request data:", data);
  
      var token = getLocalData("token");
      const response = await fetch(url + "/api/ETrack/OnInsertRequest", {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });
  
      console.log("API Response Status:", response.status);
  
      if (!response.ok) {
        let errorMessage = "บันทึกไม่สำเร็จ";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.log("Error parsing error response:", parseError);
        }
        setOpen(false);
        alert(errorMessage);
      } else {
        setOpen(false);
        alert("บันทึกสำเร็จ");
        fetchRequestsData();
        fetchTranslatorOptions();
      }
    } catch (error) {
      console.log(error);
      setOpen(false);
      alert("บันทึกไม่สำเร็จ");
    }
  };

  const cancelTranslatorRequest = async (requestId) => {
    if (!requestId) {
      console.error("Invalid request ID");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }

    try {
      setProcessingId(requestId);
      var token = getLocalData("token");

      const response = await fetch(
        `${url}/api/ETrack/OnDeleteEtrackRequest/${requestId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (response.ok) {
        const updatedRequests = requests.filter(
          (request) => request.id !== requestId
        );
        setRequests(updatedRequests);

        updateDashboardMetrics(updatedRequests);

        alert("Request cancelled successfully");

        fetchTranslatorOptions();
      } else {
        let errorMessage = "Failed to cancel request";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const updateRequestStatus = async (requestId, newStatus) => {
    if (!requestId) {
      console.error("Invalid request ID");
      return;
    }

    try {
      setProcessingId(requestId);
      var token = getLocalData("token");

      const response = await fetch(
        `${url}/api/ETrack/OnUpdateETrack?id=${requestId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
          body: JSON.stringify({
            data: newStatus,
          }),
        }
      );

      if (response.ok) {
        const updatedRequests = requests.map((request) =>
          request.id === requestId ? { ...request, status: newStatus } : request
        );
        setRequests(updatedRequests);
        updateTranslatorAvailability(updatedRequests);
        updateDashboardMetrics(updatedRequests);

        alert(`Request status updated to ${newStatus} successfully`);

        fetchTranslatorOptions();
      } else {
        let errorMessage = "Failed to update request";
        try {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const errorData = await response.json();
            errorMessage = errorData.message || errorMessage;
          }
        } catch (parseError) {
          console.error("Error parsing error response:", parseError);
        }
        alert(errorMessage);
      }
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request: " + error.message);
    } finally {
      setProcessingId(null);
    }
  };

  const renderActionButtons = (request) => {
    const isProcessing = processingId === request.id;
    const status = request.status.toLowerCase();

    const isPending = status === "pending" || status === "created";
    const isAccepted = status === "accepted";
    const isFinished = status === "finished" || status === "completed";

    return (
      <div className="action-buttons">
        {!isFinished && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => cancelTranslatorRequest(request.id)}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Cancel"}
          </button>
        )}

        {isPending && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => updateRequestStatus(request.id, "accepted")}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Accept"}
          </button>
        )}

        {isAccepted && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => updateRequestStatus(request.id, "finished")}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Finish"}
          </button>
        )}
      </div>
    );
  };

  const renderDepartmentTracker = () => {
    return (
      <div className="dashboard-panel">
        <h3 className="panel-title">Department Tracker</h3>
        <div className="table-responsive">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Current Department</th>
                <th>Arrival Time</th>
                <th>Action</th>
              </tr>
            </thead>
    
            <tbody>
              {departmentTrackers.length > 0 ? (
                departmentTrackers.map((tracker) => (
                  <tr key={tracker.id}>
                    <td>{tracker.name}</td>
                    <td>{tracker.currentDept}</td>
                    <td>{tracker.timeInDept}</td>
                    <td>
                      <div className="select-action-group">
                        <select 
                          id={`trackerDeptSelect-${tracker.id}`}
                          className="dashboard-select"
                          onChange={(e) => handleDepartmentChange(tracker.id, e.target.value)}
                          value={newDepartments[tracker.id] || ""}
                        >
                          <option value="">Select Department</option>
                          <option value="ER">ER</option>
                          <option value="ICU">ICU</option>
                          <option value="IVF">IVF</option>
                          <option value="OPD">OPD</option>
                          <option value="IPD">IPD</option>
                          <option value="After: Checkup Contract">After: Checkup Contract</option>
                          <option value="After: Surgery">After: Surgery</option>
                          <option value="After: Consultation">After: Consultation</option>
                        </select>
  
                        <button 
                          className="dashboard-btn btn-info"
                          onClick={() => updateDepartment(tracker.id)}
                          disabled={movingDepartmentId === tracker.id || !newDepartments[tracker.id]}
                        >
                          {movingDepartmentId === tracker.id ? "Processing..." : "Move Dept"}
                        </button>

                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: "center" }}>
                    No active department trackers found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const currentDateTime = "2025-03-06 07:37:37";
  const currentLoginId = "TEST";

  return (
    <div id="intCoordSection">
      <div className="header">
        <div className="title">
          E-TRACK | International Coordinator Requests
        </div>

        <div>
          {(storedEmpType === "manager" ||
            storedEmpType === "manager_translator" ||
            storedEmpType === "user") && (
            <button onClick={() => setOpen(true)} className="btn btn-primary">
              New Request
            </button>
          )}

          <IntCoordTabsModal
            open={open}
            handleClose={() => setOpen(false)}
            handleSubmit={handleSubmit}
            translatorOptions={translatorOptions}
            currentUser={currentLoginId}
            currentDateTime={currentDateTime} />
          {(storedEmpType === "manager" ||
            storedEmpType === "manager_translator" ||
            storedEmpType === "user") && (
            <button className="btn btn-export">Export Coordinator Data</button>
          )}
          <button
            className="btn btn-refresh"
            onClick={() => {
              fetchRequestsData();
              fetchTranslatorOptions();
            }}
            disabled={loading}
          >
            {loading ? "Loading..." : "Refresh Data"}
          </button>

        </div>
      </div>

      {/* แสดง Dashboard เฉพาะกรณีที่ไม่ใช่ translator */}
      {storedEmpType !== "translator" && (
        <div className="dashboard">
          <div className="card">
            <h3>Pending Coord Requests</h3>
            <div className="metric" id="coordPendingRequests">
              {
                requests.filter(
                  (req) =>
                    req.status.toLowerCase() === "pending" ||
                    req.status.toLowerCase() === "created"
                ).length
              }
            </div>
          </div>

          <div className="card">
            <h4>Completed </h4>
            <div className="metric" id="coordCompletedRequests">
              {
                requests.filter(
                  (req) =>
                    req.status.toLowerCase() === "finished" ||
                    req.status.toLowerCase() === "completed"
                ).length
              }
            </div>
          </div>

          <div className="card">
            <h3>Success Rate</h3>
            <div className="metric" id="-">
              {requests.length > 0
                ? (
                    (requests.filter((req) =>
                      ["finished", "completed"].includes(
                        req.status.toLowerCase()
                      )
                    ).length /
                      requests.length) *
                    100
                  ).toFixed(2) + "%"
                : "0%"}
            </div>
          </div>

          <div className="card">
            <h3>Avg. Handling Time</h3>
            <div className="metric" id="coordAvgResponseTime">
              0 mins
            </div>
          </div>
        </div>
      )}

      <div className="request-panel">
        <h2>International Coordinator's Requests</h2>
        {loading ? (
          <p>Loading requests data...</p>
        ) : (
          <table className="tracking-table">
            <thead>
              <tr>
                <th>Coord Req. ID</th>
                <th>Coordinator Name</th>
                <th>Language</th>
                <th>Extension</th>
                <th>Department</th>
                <th>Urgency</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {requests.length > 0 ? (
                requests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.id}</td>
                    <td>{request.coordinatorName}</td>
                    <td>{request.language}</td>
                    <td>{request.extension}</td>
                    <td>{request.department}</td>
                    <td>{request.urgency}</td>
                    <td>
                      <span
                        className={`status-indicator ${
                          request.status.toLowerCase() === "finished" ||
                          request.status.toLowerCase() === "completed"
                            ? "completed"
                            : request.status.toLowerCase() === "accepted"
                            ? "accepted"
                            : "pending"
                        }`}
                      >
                        {request.status}
                      </span>
                    </td>
                    <td>{renderActionButtons(request)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: "center" }}>
                    No requests found
                  </td>
                </tr>
              )}
            </tbody>

          </table>
        )}
      </div>

      {/* แสดงส่วนนี้เฉพาะกรณีที่ไม่ใช่ translator */}
      {storedEmpType !== "translator" && (
        <>
          <div className="request-panel">
            <h2>Coordinator Directory</h2>
            <table className="tracking-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Languages</th>
                  <th>Extension</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {translators.map((translator) => (
                  <tr key={translator.id || translator.name}>
                    <td>{translator.name}</td>
                    <td>{translator.languages}</td>
                    <td>{translator.extension}</td>
                    <td>
                      <span
                        className={`status-indicator ${
                          translator.status === "Available"
                            ? "available"
                            : "not-available"
                        }`}
                      >
                        {translator.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              
            </table>
          </div>

          {renderDepartmentTracker()}
        </>
      )}
    </div>
  );
};

export default IntCoordTab;
