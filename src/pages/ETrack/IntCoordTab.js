import IntCoordTabsModal from "./components/IntCoordTabModal";
import { useState, useEffect, useCallback } from "react";
import { url, getLocalData } from "../../helper/help";
import {
  EvaluationModal,
  EvaluationResultsModal,
} from "./components/Evaluation/EvaluationModal";

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
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [evaluationResultsModalOpen, setEvaluationResultsModalOpen] =
    useState(false);
  const [selectedRequestForEvaluation, setSelectedRequestForEvaluation] =
    useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const SYSTEM_USER_ID = localStorage.getItem("userId");
  console.log(SYSTEM_USER_ID);
  const [SYSTEM_DATETIME, setSYSTEM_DATETIME] = useState(
    new Date().toISOString().slice(0, 19).replace("T", " ")
  );

  const storedEmpType = localStorage.getItem("empType");
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
        const result = await response.json();
        const dataArray =
          typeof result === "string" ? JSON.parse(result) : result;

        const trackerData = dataArray.map((item) => {
          const lastMovedDateTime = item.last_update
            ? new Date(item.last_update)
            : new Date(`${item.request_date}T${item.request_time}`);
          const now = new Date();
          const timeDiffMs = now - lastMovedDateTime;
          const timeInDeptMinutes = Math.floor(timeDiffMs / (1000 * 60));
          const hours = Math.floor(timeInDeptMinutes / 60);
          const minutes = timeInDeptMinutes % 60;
          let timeInDeptFormatted = "Just arrived";

          if (timeInDeptMinutes > 0) {
            if (hours > 0) {
              timeInDeptFormatted = `${hours} hr${
                hours > 1 ? "s" : ""
              } ${minutes} min${minutes !== 1 ? "s" : ""}`;
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
            lastMovedTime: lastMovedDateTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
            status: item.status,
          };
        });

        setDepartmentTrackers(
          trackerData.filter(
            (tracker) =>
              tracker.status !== "cancelled" &&
              tracker.status !== "finished" &&
              tracker.status !== "completed"
          )
        );
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

  useEffect(() => {
    const timer = setInterval(() => {
      setSYSTEM_DATETIME(
        new Date().toISOString().slice(0, 19).replace("T", " ")
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmitEvaluation = async (requestId, formData) => {

    console.log("Form Data for Evaluation:", formData);
    console.log("Request ID for Evaluation:", requestId);
    if (!requestId) {
      console.error("Invalid request ID for evaluation");
      return;
    }

    try {
      const result = await submitEvaluation(requestId, formData);
      console.log("Evaluation submitted successfully");
      setEvaluationModalOpen(false);  fetchRequestsData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const submitEvaluation = async (requestId, evaluationData) => {
    try {
      const token = getLocalData("token");
      let employeeId = evaluationData.employee_id;
      if (!employeeId) {
        const request = requests.find(r => r.id === requestId || r.request_id === requestId);
        if (request && request.staff_id) {
          employeeId = request.staff_id;
        } else {
          const matchingRequest = requests.find(r => r.id === requestId || r.request_id === requestId);
          if (matchingRequest) {
            const matchingTranslator = translatorOptions.find(
              t => t.full_name === matchingRequest.coordinatorName
            );
            if (matchingTranslator) {
              employeeId = matchingTranslator.eid;
            }
          }
        }
      }
      if (!employeeId) {
        throw new Error("ไม่พบรหัสพนักงานสำหรับการประเมิน กรุณาระบุ employee_id ในข้อมูลประเมิน"); }
  
      const evaluationPayload = {
        evaluator_id: SYSTEM_USER_ID,
        employee_id: employeeId,
        evaluation_date: SYSTEM_DATETIME.split(" ")[0],
        evaluation_period: SYSTEM_DATETIME.split(" ")[0].substring(0, 7),
        status: "submitted",
        comments: evaluationData.comments || "",
        active: "1",
        request_id: requestId,
        details: evaluationData.details.map((detail) => ({
          criteria_id: detail.criteria_id,
          criteria_name: detail.criteria_name || `เกณฑ์ที่ ${detail.criteria_id}`,
          score: detail.score,
          comments: detail.comments || "",
        })),
      };
  
      console.log("Submitting evaluation payload:", JSON.stringify(evaluationPayload));
  
      const evalResponse = await fetch(
        `${url}/api/Evaluation/OnCreateEvaluation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(evaluationPayload),  }
      );
  
      if (!evalResponse.ok) {
        let errorMessage = `Failed to submit evaluation (${evalResponse.status})`;
        try {
          const errorResponse = await evalResponse.json();
          errorMessage = errorResponse.message || errorResponse.title || errorMessage;
          console.error("API error details:", errorResponse);
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        throw new Error(errorMessage); }
  
      const result = await evalResponse.json();
      // อัปเดตสถานะ request 
      await updateRequestStatus(requestId, "evaluated");
      await fetchRequestsData();
      return result;
    } catch (error) {
      console.error("Error submitting evaluation:", error);
      throw error;
    }
  };

  const getEvaluationResults = async (requestId) => {
    try {
      const token = getLocalData("token");

      console.log(`Fetching evaluation for request ID: ${requestId}`);

      const response = await fetch(
        `${url}/api/Evaluation/OnGetEvaluationByRequestId/${requestId}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log(`API response status: ${response.status}`);

      if (!response.ok) {
        throw new Error(`Failed to fetch evaluation data: ${response.status}`); }
      const responseData = await response.json();
      console.log("API response data:", responseData);

      const evaluationResult = {
        ...responseData.evaluation,
        details: responseData.details || [],
        requestId: requestId,
      };

    setEvaluationData(evaluationResult);
      return evaluationResult;
    } catch (error) {
      console.error("Error fetching evaluation results:", error);
      alert(
        `ไม่สามารถดึงข้อมูลการประเมินได้: ${
          error.message || "เกิดข้อผิดพลาดที่ไม่ทราบสาเหตุ"
        }`
      );
      throw error;
    }
  };

  const updateDepartment = async (id) => {
    if (!id || !newDepartments[id]) {
      alert("Please select a department");
      return; }
    const confirmUpdate = window.confirm(
      "Are you sure you want to update the department?"
    );
    if (!confirmUpdate) {
      return; }

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

        setNewDepartments((prev) => {
          const updated = { ...prev };
          delete updated[id];
          return updated;
        });

        alert("Department updated successfully");
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
          for (const [translator] of uniqueTranslators.entries()) {
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
          cache: 'no-store'
        }
      );
  
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
  
      const result = await response.json();
      let dataArray = [];
      
      if (Array.isArray(result)) {
        dataArray = result;
      } else if (typeof result === "string") {
        try {
          const parsed = JSON.parse(result);
          dataArray = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          console.error("Error parsing JSON string:", e);
          dataArray = [];
        }
      } else if (result && typeof result === "object") {
        dataArray = [result];
      }
  
      // Transform data
      const transformedData = dataArray.map((item) => ({
        id: item.request_id,
        request_id: item.request_id,
        coordinatorName: item.staff_name || "Unknown",
        language: item.lang || "Unknown",
        extension: item.staff_tel || "*0000",
        department: item.detail || "Unknown",
        urgency: item.priority || "Normal",
        status: item.status || "pending",
        patient_hn: item.patient_hn,
        base_service_point_id: item.base_service_point_id,
        request_date: item.request_date,
        request_time: item.request_time,
        staff_id: item.staff_id,
        last_finish: item.last_finish,
      }));
  
      // Filter requests if current user is a translator
      const currentUserRole = localStorage.getItem("empType");
      if (currentUserRole === "translator" && SYSTEM_USER_ID) {
        // Filter requests to only show those assigned to the current translator
        const filteredRequests = transformedData.filter(request => 
          request.staff_id === SYSTEM_USER_ID
        );
        setRequests(filteredRequests);
        updateDashboardMetrics(filteredRequests);
        updateTranslatorAvailability(filteredRequests);
      } else {
        // For other roles (manager, admin, etc.), show all requests
        setRequests(transformedData);
        updateDashboardMetrics(transformedData);
        updateTranslatorAvailability(transformedData);
      }
    } catch (error) {
      console.error("Error fetching requests data:", error);
    } finally {
      setLoading(false);
    }
  }, [updateTranslatorAvailability]);

const calculateHandlingTime = (requestTimeStr, requestDateStr, lastFinishStr) => {
  if (!requestTimeStr || !requestDateStr) return "-";
  try {
    const [year, month, day] = requestDateStr.split("-").map(Number);
    const [hours, minutes, seconds] = requestTimeStr.split(":").map(Number);

    const requestDateTime = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds
    );

    let endDateTime;
    if (lastFinishStr) {
      endDateTime = new Date(lastFinishStr.replace(" ", "T"));
    } else {
      endDateTime = new Date();
    }
    const diffMs = endDateTime - requestDateTime;
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

const calculateHandlingTimeInMinutes = (requestTimeStr, requestDateStr, lastFinishStr) => {
  if (!requestTimeStr || !requestDateStr) return 0;
  try {
    const [year, month, day] = requestDateStr.split("-").map(Number);
    const [hours, minutes, seconds] = requestTimeStr.split(":").map(Number);
    const requestDateTime = new Date(
      year,
      month - 1,
      day,
      hours,
      minutes,
      seconds
    );

    let endDateTime;
    if (lastFinishStr) {
      endDateTime = new Date(lastFinishStr.replace(" ", "T"));
    } else {
      endDateTime = new Date();
    }

    const diffMs = endDateTime - requestDateTime;
    return Math.floor(diffMs / (1000 * 60));
  } catch (error) {
    console.error("Error calculating handling time in minutes:", error);
    return 0;
  }
};
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
    let totalMinutes = 0;
    let countableRequests = 0;
  
    requestsData.forEach((request) => {
      if (request.request_time && request.request_date) {
        totalMinutes += calculateHandlingTimeInMinutes(
          request.request_time,
          request.request_date,
          request.last_finish
        );
        countableRequests++;
      }
    });
  
    let avgTimeText = "0 mins";
    if (countableRequests > 0) {
      const avgMinutes = Math.round(totalMinutes / countableRequests);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
  
      if (hours > 0) {
        avgTimeText = `${hours}h ${minutes}m`;
      } else {
        avgTimeText = `${avgMinutes} mins`;
      }
    }
    const pendingElement = document.getElementById("coordPendingRequests");
    const completedElement = document.getElementById("coordCompletedRequests");
    const completionRateElement = document.getElementById("coordCompletionRate");
    const avgTimeElement = document.getElementById("coordAvgResponseTime");
  
    if (pendingElement) pendingElement.textContent = pendingRequests;
    if (completedElement) completedElement.textContent = completedRequests;
    if (completionRateElement)
      completionRateElement.textContent = `${completionRate}%`;
    if (avgTimeElement)
      avgTimeElement.textContent = avgTimeText;
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
    const status = (request.status || "").toLowerCase();
  
    const userRole = localStorage.getItem("empType");
    const isManagerOrAdmin =
      userRole === "manager" ||
      userRole === "admin" ||
      userRole === "manager_translator";
  
    const isPending = status === "pending" || status === "created";
    const isAccepted = status === "accepted";
    const isFinished = status === "finished" || status === "completed";
    const isEvaluated = status === "evaluated";
  
    return (
      <div className="action-buttons">
        {!isEvaluated && !isFinished && (
          <button
            className="btn btn-danger btn-sm"
            onClick={() => cancelTranslatorRequest(request.id)}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "กำลังประมวลผล..." : "Cancel"}
          </button>
        )}
        {isPending && (
          <button
            className="btn btn-success btn-sm"
            onClick={() => updateRequestStatus(request.id, "accepted")}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "กำลังประมวลผล..." : "Accept"}
          </button>
        )}
        {isAccepted && (
          <button
            className="btn btn-primary btn-sm"
            onClick={() => updateRequestStatus(request.id, "finished")}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "กำลังประมวลผล..." : "Finish"}
          </button>
        )}
  
        {isManagerOrAdmin && isFinished && !isEvaluated && (
          <button
            className="btn btn-info btn-sm"
            onClick={() => {
              // ค้นหาข้อมูล translator
              const selectedTranslator = translatorOptions.find(
                (t) => t.full_name === request.coordinatorName );
              const completeRequest = {
                ...request,
                request_id: request.request_id || request.id,
                staff_id: selectedTranslator ? selectedTranslator.eid : request.staff_id || "",
              };
  
              setSelectedRequestForEvaluation(completeRequest);
              setEvaluationModalOpen(true);
            }}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "กำลังประมวลผล..." : "Evaluate Staff"}
          </button>
        )}
  
        {isManagerOrAdmin && isEvaluated && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={async () => {
              try {
                const requestIdForEvaluation = request.request_id || request.id;
                const results = await getEvaluationResults(requestIdForEvaluation);
                setEvaluationData(results);
                setEvaluationResultsModalOpen(true);
              } catch (error) {
                alert("Error fetching evaluation results: " + error.message);
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? "กำลังประมวลผล..." : "View Evaluation"}
          </button>
        )}
      </div>
    );
  };
  useEffect(() => {
    fetchRequestsData();
  }, [fetchRequestsData]);

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
                          onChange={(e) =>
                            handleDepartmentChange(tracker.id, e.target.value)
                          }
                          value={newDepartments[tracker.id] || ""}
                        >
                          <option value="">Select Department</option>
                          <option value="ER">ER</option>
                          <option value="ICU">ICU</option>
                          <option value="IVF">IVF</option>
                          <option value="OPD">OPD</option>
                          <option value="IPD">IPD</option>
                          <option value="After: Checkup Contract">
                            After: Checkup Contract
                          </option>
                          <option value="After: Surgery">After: Surgery</option>
                          <option value="After: Consultation">
                            After: Consultation
                          </option>
                        </select>

                        <button
                          className="dashboard-btn btn-info"
                          onClick={() => updateDepartment(tracker.id)}
                          disabled={
                            movingDepartmentId === tracker.id ||
                            !newDepartments[tracker.id] }
                        >
                          {movingDepartmentId === tracker.id
                            ? "Processing..."
                            : "Move Dept" }
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
  const currentLoginId = localStorage.getItem("fullName");

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
            currentDateTime={currentDateTime}
          />
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
    <div className="loading-container">
      <p>กำลังโหลดข้อมูล...</p>
      <div className="loading-spinner"></div>
    </div>
  ) : (
    <div className="table-responsive">
      <table className="tracking-table">
            <thead>
              <tr>
                <th>Coord Req. ID</th>
                <th>Coordinator Name</th>
                <th>Language</th>
                <th>Extension</th>
                <th>Department</th>
                <th>Urgency</th>
                <th>Handling Time</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
  {requests.length > 0 ? (
    // Add sorting here, before mapping over the requests
    [...requests]
      .sort((a, b) => b.id - a.id)
      .map((request) => (
        <tr key={request.id}>
          <td>{request.id}</td>
          <td>{request.coordinatorName}</td>
          <td>{request.language}</td>
          <td>{request.extension}</td>
          <td>{request.department}</td>
          <td>{request.urgency}</td>
          <td>
            {calculateHandlingTime(
              request.request_time,
              request.request_date,
              request.last_finish
            )}
          </td>
          <td>
            <span
              className={`status-indicator ${
                request.status?.toLowerCase() === "evaluated"
                  ? "evaluated"
                  : request.status?.toLowerCase() === "finished" ||
                    request.status?.toLowerCase() === "completed"
                  ? "completed"
                  : request.status?.toLowerCase() === "accepted"
                  ? "accepted"
                  : "pending"
              }`}
            >
              {request.status || "pending"}
            </span>
          </td>
          <td>{renderActionButtons(request)}</td>
        </tr>
      ))
  ) : (
    <tr>
      <td colSpan="9" style={{ textAlign: "center" }}>
        ไม่พบข้อมูลคำขอ
      </td>
    </tr>
  )}
</tbody>
      </table>
    </div>
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

          {/* ตารางDepartment */}
          {/* {renderDepartmentTracker()}  */}
         <EvaluationModal
            open={evaluationModalOpen}
            handleClose={() => setEvaluationModalOpen(false)}
            request={selectedRequestForEvaluation}
            onSubmitEvaluation={handleSubmitEvaluation}
            currentUser={SYSTEM_USER_ID} 
         />
        <EvaluationResultsModal
            open={evaluationResultsModalOpen}
            handleClose={() => setEvaluationResultsModalOpen(false)}
            evaluationData={evaluationData}
          />
        </>
      )}
    </div>
  );
};

export default IntCoordTab;
