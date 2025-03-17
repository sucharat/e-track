import { useState, useEffect, useCallback } from "react";
import PatientModal from "./components/PatientModal";
import { url, getLocalData } from "../../helper/help";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import './Manager.css';

const Patient = () => {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [departmentTrackers, setDepartmentTrackers] = useState([]);
  const [movingDepartmentId, setMovingDepartmentId] = useState(null);
  const [newDepartments, setNewDepartments] = useState({});
  const [equipmentList, setEquipmentList] = useState([]);
  const [isRefreshingCoordinators, setIsRefreshingCoordinators] = useState(false);
  
  const currentUserRole = localStorage.getItem("empType");
  const [translators, setTranslators] = useState([]);
  const [translatorOptions, setTranslatorOptions] = useState([]);

  dayjs.extend(relativeTime);

  const initialEscorts = [
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
  ];
  
  const [escorts, setEscorts] = useState(initialEscorts);

  // Fetch equipment data from API
  const fetchEquipment = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetEquipment",
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
        const equipmentData = typeof result === "string" ? JSON.parse(result) : result;
        console.log("Equipment Data:", equipmentData);
        setEquipmentList(equipmentData);
      }
    } catch (error) {
      console.error("Error fetching equipment data:", error);
    }
  }, []);

  // Fetch translator options from API
  const fetchTranslatorOptions = useCallback(async () => {
    try {
      setIsRefreshingCoordinators(true);
      const token = getLocalData("token");
      const response = await fetch(
        url + "/api/ETrack/OnGetStaff?type=patient_escort",
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
        const translatorData = typeof result === "string" ? JSON.parse(result) : result;
        console.log("Translator Options:", translatorData);
        
        // Set raw translator options data
        setTranslatorOptions(translatorData);
        
        // Directly convert the API data to the format needed for display
        const formattedTranslators = translatorData.map(translator => ({
          id: translator.eid,
          name: translator.full_name,
          languages: translator.lang || "Unknown",
          extension: translator.tel || "*0000",
          status: translator.is_free === "1" ? "Available" : "Not Available",
          hasPendingRequest: false
        }));
        
        setTranslators(formattedTranslators);
      }
    } catch (error) {
      console.error("Error fetching translator options:", error);
    } finally {
      setIsRefreshingCoordinators(false);
    }
  }, []);

  const updateTranslatorAvailability = useCallback(
    (requestsData) => {
      const updatedTranslators = [...translators];
      
      if (requestsData && requestsData.length > 0) {
        requestsData.forEach((request) => {
          if (
            request.staff_name &&
            (request.status.toLowerCase() === "pending" ||
             request.status.toLowerCase() === "created")
          ) {
            const translatorIndex = updatedTranslators.findIndex(
              (t) => t.name === request.staff_name
            );
            
            if (translatorIndex !== -1) {
              updatedTranslators[translatorIndex] = {
                ...updatedTranslators[translatorIndex],
                hasPendingRequest: true,
                status: "Not Available"
              };
            }
          }
        });
      }
      
      setTranslators(updatedTranslators);
    },
    [translators]
  );

  // Refresh all escort data
  const refreshEscortData = useCallback(async () => {
    try {
      setIsRefreshingCoordinators(true);
      
      setEscorts([...initialEscorts]);
      
      await fetchTranslatorOptions();
      
      await fetchRequests();
      
    } catch (error) {
      console.error("Error refreshing escort data:", error);
    } finally {
      setIsRefreshingCoordinators(false);
    }
  }, [fetchTranslatorOptions, initialEscorts]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const calculateHandlingTime = (requestTimeStr, requestDateStr) => {
    if (!requestTimeStr || !requestDateStr) return "-";

    try {
      const [year, month, day] = requestDateStr.split("-").map(Number);
      const [hours, minutes, seconds] = requestTimeStr.split(":").map(Number);
      
      const requestDateTime = new Date(year, month - 1, day, hours, minutes, seconds);
      const now = currentTime;
      
      const diffMs = now - requestDateTime;
      
      const diffMinutes = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMinutes / 60);
      const remainingMinutes = diffMinutes % 60;
      
      if (diffHours > 0) {
        return `${diffHours}h ${remainingMinutes}m`;
      } else {
        return `${diffMinutes}m`;
      }
    } catch (error) {
      console.error("Error calculating handling time:", error);
      return "-";
    }
  };

  const calculateHandlingTimeInMinutes = (requestTimeStr, requestDateStr) => {
    if (!requestTimeStr || !requestDateStr) return 0;

    try {
      const [year, month, day] = requestDateStr.split("-").map(Number);
      const [hours, minutes, seconds] = requestTimeStr.split(":").map(Number);
      
      const requestDateTime = new Date(year, month - 1, day, hours, minutes, seconds);
      const now = currentTime;

      const diffMs = now - requestDateTime;
      
      return Math.floor(diffMs / (1000 * 60));
    } catch (error) {
      console.error("Error calculating handling time:", error);
      return 0;
    }
  };

  const calculateAvgHandlingTime = () => {
    if (requests.length === 0) return "- mins";
    
    let totalMinutes = 0;
    let countableRequests = 0;
    
    requests.forEach(request => {
      if (request.request_time && request.request_date) {
        totalMinutes += calculateHandlingTimeInMinutes(request.request_time, request.request_date);
        countableRequests++;
      }
    });
    
    if (countableRequests === 0) return "- mins";
    
    const avgMinutes = Math.round(totalMinutes / countableRequests);
    const hours = Math.floor(avgMinutes / 60);
    const minutes = avgMinutes % 60;
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${avgMinutes} mins`;
    }
  };

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
        
        // Update translator availability based on requests if we have translators
        if (translators.length > 0) {
          updateTranslatorAvailability(resBody);
        }
      }
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchEquipment();
    fetchTranslatorOptions();
  }, [fetchEquipment, fetchTranslatorOptions]);

  const departmentMapping = {
    "After: Checkup Contract": "D001",
    "After: Dermatology Department": "D002",
    "After: Heart Clinic": "D003",
    "Anesthesiology Department": "D004",
    "BadalVeda Diving Medical Center": "D005",
    "C.C.U.": "D006"
  };

  const submitPatientEscortRequest = async (formData) => {
    try {
      var token = getLocalData("token");
  
      if (!formData.item || formData.item.length === 0) {
        alert("กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ");
        return;
      }
  
      const equipments = formData.item.map((itemId) => ({
        equipment_id: itemId,
        qty: "1"
      }));
      
      // Check if department should be an ID instead of a string
      const departmentId = departmentMapping[formData.department] || formData.department;
  
      const requestData = {
        type: "patient_escort",
        patient_hn: formData.patient,
        base_service_point_id: departmentId, // Ensure this is an ID if required
        detail: `Priority: ${formData.priority}`,
        staff_id: currentUser, 
        priority: formData.priority || "Normal",
        escort: formData.escort || "",
        item: formData.item.join(","), // Ensure it's a proper format
        equipments: equipments,
        req: "required_value" // Add this line
      };
  
      console.log("Sending Request Data:", JSON.stringify(requestData, null, 2));
  
      const response = await fetch(url + "/api/ETrack/OnInsertRequest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
        body: JSON.stringify(requestData),
      });
  
      console.log("API Response Status:", response.status);
      let responseData;
      
      try {
        responseData = await response.json();
        console.log("Response Data:", responseData);
      } catch (e) {
        console.error("Error parsing response:", e);
        alert("Error processing response from server.");
        return;
      }
  
      if (!response.ok) {
        console.error("API Error Response:", responseData);
  
        let errorMessage = "Unknown error occurred.";
        if (responseData?.message) {
          errorMessage = responseData.message;
        } else if (responseData?.errors) {
          errorMessage = Object.entries(responseData.errors)
            .map(([key, value]) => `${key}: ${value}`)
            .join("; ");
        } else if (responseData?.title) {
          errorMessage = responseData.title;
        }
  
        alert("Failed to submit: " + errorMessage);
        return;
      }
  
      if (responseData?.success) {
        alert("Request submitted successfully! ID: " + (responseData.requestId || "N/A"));
        fetchRequests();
        setOpen(false);
      } else {
        alert("Request may not have been processed properly.");
      }
    } catch (error) {
      console.error("Exception Error:", error);
      alert("Error submitting request: " + error.message);
    }
  };

const getEquipmentNameById = useCallback((equipmentId) => {
  if (!equipmentId || !equipmentList || equipmentList.length === .0) {
    return "-";
  }
  
  const equipment = equipmentList.find(eq => eq.id.toString() === equipmentId.toString());
  return equipment ? equipment.equipment_name : `Unknown (${equipmentId})`;
}, [equipmentList]);

const formatItemDisplay = useCallback((itemString) => {
  if (!itemString || itemString === "-") {
    return "-";
  }
  
  try {

    const itemIds = itemString.split(',').map(item => item.trim());

    return itemIds.map(id => getEquipmentNameById(id)).join(', ');
  } catch (error) {
    console.error("Error formatting item display:", error);
    return itemString; 
  }
}, [getEquipmentNameById]);
  
  const handleSubmit = (event, formData) => {
    event.preventDefault();
    console.log("Submitting request:", formData);
    submitPatientEscortRequest(formData);
    setOpen(false);
  };

  const cancelPatientEscortRequest = async (requestId) => {
    if (!requestId) {
      console.error("Invalid request ID");
      return;
    }

    if (!window.confirm("Are you sure you want to cancel this request?")) {
      return;
    }

    try {
      setIsLoading(true);
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

      const iStatusCode = response.status;
      if (iStatusCode === 200) {
        setRequests(
          requests.filter((request) => request.request_id !== requestId)
        );
        alert("Request cancelled successfully");
      } else {
        const errorData = await response.json();
        console.error("Error cancelling request:", errorData);
        alert(
          "Failed to cancel request: " + (errorData.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error cancelling request:", error);
      alert("Failed to cancel request: " + error.message);
    } finally {
      setIsLoading(false);
      setProcessingId(null);
    }
  };

  // Function to update the status of a request
  const updateRequestStatus = async (requestId, newStatus) => {
    if (!requestId) {
      console.error("Invalid request ID");
      return;
    }

    try {
      setIsLoading(true);
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
        // Update local state to reflect the change without reloading
        setRequests(
          requests.map((request) =>
            request.request_id === requestId
              ? { ...request, status: newStatus }
              : request
          )
        );
        alert(`Request status updated to ${newStatus} successfully`);
        
        fetchRequests();
      } else {
        const errorData = await response.json();
        console.error("Error updating request:", errorData);
        alert(
          "Failed to update request: " + (errorData.message || "Unknown error")
        );
      }
    } catch (error) {
      console.error("Error updating request:", error);
      alert("Failed to update request: " + error.message);
    } finally {
      setIsLoading(false);
      setProcessingId(null);
    }
  };

  const fetchDepartmentTrackerData = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(url + "/api/ETrack/OnGetEtrackRequest?Type=patient_escort", {
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
      
    const confirmUpdate = window.confirm("Are you sure you want to update the department?");
    if (!confirmUpdate) {
      return;  }
      
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

  const renderDepartmentTracker = () => {
    // ฟังก์ชันแปลงเวลาจากจำนวน minutes(นาที) เป็น "xxhr xxm"
    const formatTimeInDept = (minutes) => {
      if (typeof minutes !== "number" || isNaN(minutes) || minutes === 0) return "00hr 00m";
  
      const hours = Math.floor(minutes / 60); // คำนวณชั่วโมง
      const remainingMinutes = minutes % 60; // คำนวณนาทีที่เหลือ
  
      // คืนค่าผลลัพธ์ในรูปแบบ "xxhr xxm"
      return `${String(hours).padStart(2, '0')}hr ${String(remainingMinutes).padStart(2, '0')}m`;
    };
  
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
                    {/* ใช้ฟังก์ชัน formatTimeInDept เพื่อแสดงเวลาในรูปแบบที่ต้องการ */}
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
  
  // Calculate metrics for the dashboard
  const pendingRequests = requests.filter(
    (r) => r.status === "pending" || r.status === "created"
  ).length;
  const completedRequests = requests.filter(
    (r) => r.status === "finished"
  ).length;
  const totalRequests = requests.length;
  const completionRate =
    totalRequests > 0
      ? Math.round((completedRequests / totalRequests) * 100)
      : 0;

      const sortedRequests = [...requests].sort((a, b) => {
        // เรียงตาม request_id จากมากไปน้อย (หากเป็นตัวเลข)
        return parseInt(b.request_id) - parseInt(a.request_id);
      });

  // Updated to match provided user login and datetime
  const currentUser = "test";
  const currentDateTime = "2025-03-07 19:32:39";

  const renderActionButtons = (request) => {
    const isProcessing = processingId === request.request_id;

    const showCancelButton = request.status !== "finished";

    const showAcceptButton =
      request.status === "pending" || request.status === "created";

    const showFinishButton = request.status === "accepted";

    return (
      <div className="action-buttons">
        {showCancelButton && (
          <button
            className="btn btn-danger"
            onClick={() => cancelPatientEscortRequest(request.request_id)}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Cancel"}
          </button>
        )}

        {showAcceptButton && (
          <button
            className="btn btn-success"
            onClick={() => updateRequestStatus(request.request_id, "accepted")}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Accept"}
          </button>
        )}

        {showFinishButton && (
          <button
            className="btn btn-primary"
            onClick={() => updateRequestStatus(request.request_id, "finished")}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Finish"}
          </button>
        )}
      </div>
    );
  };

  // Render Live Escort Tracking with refresh button
  const renderLiveEscortTracking = () => {
    return (
      <div className="request-panel">
        {/* comment ไว้ก่อนเผื่อได้เอามาใช้
        <div className="panel-header">
          <h2>Live Escort Tracking</h2>
          <button 
            className="btn btn-refresh" 
            onClick={refreshEscortData}
            disabled={isRefreshingCoordinators}
          >
            {isRefreshingCoordinators ? "Refreshing..." : "Refresh Data"}
          </button>
        </div> */}
        
        <table className="tracking-table">
          {/* comment ไว้ก่อนเผื่อได้เอามาใช้ 
          <thead>
            <tr>
              <th>Name</th>
              <th>Extension</th>
              <th>Status</th>
            </tr>
          </thead> */}
          <tbody>
            {/* comment ไว้ก่อนเผื่อได้เอามาใช้
            {translators.map((translator) => (
              <tr key={translator.id || translator.name}>
                <td>{translator.name}</td>
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
            ))} */}

            {translators.length === 0 && (
              <tr>
                <td colSpan="3" style={{ textAlign: "center" }}>
                  No coordinators available
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div id="patientEscortSection">
      <div className="header">
        <div className="title">E-TRACK | My Escort Requests</div>
        <div>
          {(currentUserRole === "manager" ||
            currentUserRole === "manager_patient" ||
            currentUserRole === "user") && (
            <button onClick={() => setOpen(true)} className="btn btn-primary">
              New Request
            </button>
          )}

          <PatientModal
            open={open}
            handleClose={() => setOpen(false)}
            handleSubmit={handleSubmit}
            currentUser={currentUser}
            currentDateTime={currentDateTime}
            equipmentList={equipmentList}
          />
          {(currentUserRole === "manager" ||
            currentUserRole === "manager_patient" ||
            currentUserRole === "user") && (
            <button className="btn btn-export">Export My Data</button>
          )}
        </div>
      </div>

      {currentUserRole !== "patient_escort" && (
        <div className="dashboard">
          <div className="card">
            <h3>Pending Requests</h3>
            <div className="metric" id="pendingRequests">
              {pendingRequests}
            </div>
          </div>

          <div className="card">
            <h3>Completed</h3>
            <div className="metric">{completedRequests}</div>
          </div>

          <div className="card">
            <h3>Success Rate</h3>
            <div className="metric" id="-">
              {parseFloat(completionRate).toFixed(2)}%
            </div>
          </div>

          <div className="card">
            <h3>Avg. Handling Time</h3>
            <div className="metric" id="patientEscortAvgResponseTime">
              {calculateAvgHandlingTime()}
            </div>
          </div>
        </div>
      )}

      <div className="request-panel">
        <h2>My Requests</h2>
        {isLoading && !processingId ? (
          <div className="loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="no-data">No requests found</div>
        ) : (
          <table className="tracking-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Patient Name</th>
                <th>Department</th>
                <th>Priority</th>
                <th>Escort</th>
                <th>Handling Time</th>
                <th>Item</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {sortedRequests.map((request) => (
                <tr key={request.request_id}>
                  <td>{request.request_id}</td>
                  <td>{request.patient_hn}</td>
                  <td>{request.base_service_point_id}</td>
                  <td>{request.priority || "-"}</td>
                  <td>{request.request_type}</td>
                  <td>
                    {calculateHandlingTime(
                      request.request_time,
                      request.request_date
                    )}
                  </td>
                  <td>{formatItemDisplay(request.item)}</td>
                  <td>
                    <span
                      className={`status-indicator ${request.status.toLowerCase()}`}
                    >
                      {request.status}
                    </span>
                  </td>
                  <td>{renderActionButtons(request)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {currentUserRole !== "patient_escort" && (
        <>
          {/* Added Live Escort Tracking with refresh button */}
          {renderLiveEscortTracking()}

          {renderDepartmentTracker()}
        </>
      )}
      
    </div>
  );
};

export default Patient;