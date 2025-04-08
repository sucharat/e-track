import { useState, useEffect, useCallback } from "react";
import PatientModal from "./components/PatientModal";
import { url, getLocalData } from "../../helper/help";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "./Manager.css";
// import { submitEvaluation } from './components/Evaluation/EvaluationService';
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import ExportModal from "./components/Patient/ExportsModal";
import * as XLSX from "xlsx";

import {
  EvaluationModal,
  EvaluationResultsModal,
} from "./components/Evaluation/EvaluationModal";

const Patient = () => {
  const [open, setOpen] = useState(false);
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [processingId, setProcessingId] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [, setDepartmentTrackers] = useState([]);
  const [, setMovingDepartmentId] = useState(null);
  const [newDepartments, setNewDepartments] = useState({});
  const [equipmentList, setEquipmentList] = useState([]);
  const [, setIsRefreshingCoordinators] = useState(false);

  const currentUserRole = localStorage.getItem("empType");
  const [translators, setTranslators] = useState([]);
  const [translatorOptions, setTranslatorOptions] = useState([]);

  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);
  const [evaluationResultsModalOpen, setEvaluationResultsModalOpen] =
    useState(false);
  const [selectedRequestForEvaluation, setSelectedRequestForEvaluation] =
    useState(null);
  const [evaluationData, setEvaluationData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [exportModalOpen, setExportModalOpen] = useState(false);

  dayjs.extend(relativeTime);

  useEffect(() => {
    const dateTimer = setInterval(() => {
      if (
        selectedDate &&
        dayjs().format("YYYY-MM-DD") === selectedDate.format("YYYY-MM-DD")
      ) {
        setSelectedDate(dayjs());
      }
    }, 60000);
    return () => clearInterval(dateTimer);
  }, [selectedDate]);

  const initialEscorts = [
    // {
    //   name: "นิคม วรรณเลิศอุดม",
    //   status: "available",
    //   currentTask: "None",
    // },
    // {
    //   name: "วิศว กิจผ่องแผ้ว",
    //   status: "occupied",
    //   currentTask: "None",
    // },
    // {
    //   name: "อภิชาติ เก้าเอี้ยน",
    //   status: "ontheway",
    //   currentTask: "Transporting Request 10001",
    // },
  ];

  const [, setEscorts] = useState(initialEscorts);
  const [SYSTEM_DATETIME, setSYSTEM_DATETIME] = useState(
    new Date().toISOString().slice(0, 19).replace("T", " ")
  );
  const SYSTEM_USER_ID = localStorage.getItem("userId");
  console.log("SYSTEM_USER_ID:", SYSTEM_USER_ID);
  const SYSTEM_USER_FULLNAME = localStorage.getItem("fullName");

  useEffect(() => {
    const timer = setInterval(() => {
      setSYSTEM_DATETIME(
        new Date().toISOString().slice(0, 19).replace("T", " ")
      );
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmitEvaluation = async (requestId, formData) => {
    try {
      const result = await submitEvaluation(requestId, formData);

      console.log("Evaluation submitted successfully");

      await updateRequestStatus(requestId, "evaluated");

    return result;
  } catch (error) {
    throw error;
    }
  };

  const fetchEquipment = useCallback(async () => {
    try {
      const token = getLocalData("token");
      const response = await fetch(url + "/api/ETrack/OnGetEquipment", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: "Bearer " + token,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const equipmentData =
          typeof result === "string" ? JSON.parse(result) : result;
        console.log("Equipment Data:", equipmentData);
        setEquipmentList(equipmentData);
      }
    } catch (error) {
      console.error("Error fetching equipment data:", error);
    }
  }, []);

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
        const translatorData =
          typeof result === "string" ? JSON.parse(result) : result;
        console.log("Translator Options:", translatorData);

        setTranslatorOptions(translatorData);

        const formattedTranslators = translatorData.map((translator) => ({
          id: translator.eid,
          name: translator.full_name,
          languages: translator.lang || "Unknown",
          extension: translator.tel || "*0000",
          status: translator.is_free === "1" ? "Available" : "Not Available",
          hasPendingRequest: false,
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
                status: "Not Available",
              };
            }
          }
        });
      }

      setTranslators(updatedTranslators);
    },
    [translators]
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  const filterRequestsByDate = useCallback((requests, filterDate) => {
    if (!filterDate) return requests;

    return requests.filter((request) => {
      return request.request_date === filterDate.format("YYYY-MM-DD");
    });
  }, []);

  const calculateHandlingTime = (
    requestTimeStr,
    requestDateStr,
    lastFinishStr
  ) => {
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

  const calculateHandlingTimeInMinutes = (
    requestTimeStr,
    requestDateStr,
    lastFinishStr
  ) => {
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
        endDateTime = currentTime;
      }

      const diffMs = endDateTime - requestDateTime;
      return Math.floor(diffMs / (1000 * 60));
    } catch (error) {
      console.error("Error calculating handling time in minutes:", error);
      return 0;
    }
  };

  const calculateAvgHandlingTime = () => {
    if (requests.length === 0) return "- mins";

    let totalMinutes = 0;
    let countableRequests = 0;

    requests.forEach((request) => {
      if (request.request_time && request.request_date) {
        totalMinutes += calculateHandlingTimeInMinutes(
          request.request_time,
          request.request_date,
          request.last_finish
        );
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

  // In the fetchRequests function, modify it to filter requests based on user role
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

        // Filter requests if the current user is a patient_escort
        if (currentUserRole === "patient_escort" && SYSTEM_USER_ID) {
          // Filter requests to only show those assigned to the current escort
          const filteredRequests = resBody.filter(
            (request) =>
              request.escort === SYSTEM_USER_ID ||
              request.staff_id === SYSTEM_USER_ID
          );
          setRequests(filteredRequests);
        } else {
          // For other roles, show all requests
          setRequests(resBody);
        }

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
    "C.C.U.": "D006",
  };

  const refreshTranslatorData = async () => {
    try {
      await fetchTranslatorOptions();
      return true;
    } catch (error) {
      console.error("Error refreshing translator data:", error);
      return false;
    }
  };

  const submitEvaluation = async (requestId, evaluationData) => {
    try {
      const token = getLocalData("token");

      // Find the staff ID from the request
      const request = requests.find((r) => r.request_id === requestId);
      if (!request || !request.staff_id) {
        throw new Error("Staff ID not found in request data");
      }

      const evaluationPayload = {
        evaluator_id: SYSTEM_USER_ID,
        employee_id: request.staff_id,
        evaluation_date: SYSTEM_DATETIME.split(" ")[0], // YYYY-MM-DD
        evaluation_period: SYSTEM_DATETIME.split(" ")[0].substring(0, 7), // YYYY-MM
        status: "submitted",
        comments: evaluationData.comments || "",
        active: "1",
        request_id: requestId,
        details: evaluationData.details.map((detail) => {
          return {
            criteria_id: detail.criteria_id,
            criteria_name:
              detail.criteria_name || `เกณฑ์ที่ ${detail.criteria_id}`,
            score: detail.score,
            comments: detail.comments || "",
          };
        }),
      };

      console.log(
        "Submitting evaluation payload:",
        JSON.stringify(evaluationPayload)
      );

      // Submit evaluation
      const evalResponse = await fetch(
        `${url}/api/Evaluation/OnCreateEvaluation`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(evaluationPayload),
        }
      );

      if (!evalResponse.ok) {
        let errorMessage = `Failed to submit evaluation (${evalResponse.status})`;
        try {
          const errorResponse = await evalResponse.json();
          errorMessage =
            errorResponse.message || errorResponse.title || errorMessage;
          console.error("API error details:", errorResponse);
        } catch (e) {
          // If we can't parse the error JSON, stick with the default message
        }
        throw new Error(errorMessage);
      }

      const result = await evalResponse.json();
        await updateRequestStatus(requestId, "evaluated");

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
        throw new Error(`Failed to fetch evaluation data: ${response.status}`);
      }

      // ดึงข้อมูลจาก response
      const responseData = await response.json();
      console.log("API response data:", responseData);

      // เตรียมข้อมูลสำหรับแสดงผล
      const evaluationResult = {
        ...responseData.evaluation,
        details: responseData.details || [],
        requestId: requestId,
      };

      // บันทึกข้อมูลลงใน state
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

  const submitPatientEscortRequest = async (formData) => {
    try {
      var token = getLocalData("token");

      if (!formData.item || formData.item.length === 0) {
        alert("กรุณาเลือกอุปกรณ์อย่างน้อย 1 รายการ");
        return;
      }

      const equipments = formData.item.map((itemId) => ({
        equipment_id: itemId,
        qty: "1",
      }));

      const departmentId =
        departmentMapping[formData.department] || formData.department;
      let staffId = "";
      if (formData.escort) {
        const selectedEscort = translatorOptions.find(
          (escort) =>
            escort.eid === formData.escort ||
            escort.full_name === formData.escort
        );

        staffId = selectedEscort ? selectedEscort.eid : currentUser;
      } else {
        staffId = currentUser;
      }

      const requestData = {
        type: "patient_escort",
        patient_hn: formData.patient,
        base_service_point_id: departmentId,
        detail: `Priority: ${formData.priority}`,
        staff_id: staffId,
        priority: formData.priority || "Normal",
        escort: formData.escort || "",
        item: formData.item.join(","),
        equipments: equipments,
        req: "required_value",
      };

      console.log(
        "Sending Request Data:",
        JSON.stringify(requestData, null, 2)
      );

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
        alert(
          "Request submitted successfully! ID: " +
            (responseData.requestId || "N/A")
        );
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

  const getEquipmentNameById = useCallback(
    (equipmentId) => {
      if (!equipmentId || !equipmentList || equipmentList.length === 0.0) {
        return "-";
      }
    const equipment = equipmentList.find(
        (eq) => eq.id.toString() === equipmentId.toString()
      );
      return equipment ? equipment.equipment_name : `Unknown (${equipmentId})`;
    },
    [equipmentList]
  );

  const formatItemDisplay = useCallback(
    (itemString) => {
      if (!itemString || itemString === "-") {
        return "-";
      }

      try {
        const itemIds = itemString.split(",").map((item) => item.trim());

        return itemIds.map((id) => getEquipmentNameById(id)).join(", ");
      } catch (error) {
        console.error("Error formatting item display:", error);
        return itemString;
      }
    },
    [getEquipmentNameById]
  );

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

  const updateDepartment = async (id) => {
    if (!id || !newDepartments[id]) {
      alert("Please select a department");
      return;
    }

    const confirmUpdate = window.confirm(
      "Are you sure you want to update the department?"
    );
    if (!confirmUpdate) {
      return;
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

  const handleExportData = async (startDate, endDate) => {
    try {
      const token = getLocalData("token");

      // Format dates for API
      const formattedStartDate = startDate.format("YYYY-MM-DD");
      const formattedEndDate = endDate.format("YYYY-MM-DD");

      console.log(
        `Fetching data from ${formattedStartDate} to ${formattedEndDate}`
      );

      // สำหรับการทดสอบ ถ้า API ไม่รองรับการกรองวันที่ เราจะดึงทั้งหมดแล้วกรองเอง
      const response = await fetch(
        `${url}/api/ETrack/OnGetEtrackRequest?Type=patient_escort`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: "Bearer " + token,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }

      const result = await response.json();
      let data = typeof result === "string" ? JSON.parse(result) : result;

      // กรองตามวันที่ด้วยตัวเอง (ในกรณีที่ API ไม่รองรับพารามิเตอร์ startDate และ endDate)
      data = data.filter((item) => {
        const requestDate = item.request_date;
        return (
          requestDate >= formattedStartDate && requestDate <= formattedEndDate
        );
      });

      console.log(`Filtered data count: ${data.length}`);

      // เพิ่มข้อมูล equipment จาก equipmentList
      const enhancedData = data.map((request) => {
        // ถ้ามี item ให้แปลง item เป็นชื่อ equipment
        if (request.item) {
          const itemIds = request.item.split(",").map((id) => id.trim());
          const equipmentNames = itemIds.map((id) => {
            const equipment = equipmentList.find(
              (eq) => eq.id.toString() === id.toString()
            );
            return equipment ? equipment.equipment_name : `Unknown (${id})`;
          });
          request.equipment_name = equipmentNames.join(", ");
        } else {
          request.equipment_name = "ไม่ระบุ (Not Specified)";
        }

        return request;
      });

      // If the current user is a patient_escort, filter the data
      if (currentUserRole === "patient_escort" && SYSTEM_USER_ID) {
        return enhancedData.filter(
          (request) =>
            request.escort === SYSTEM_USER_ID ||
            request.staff_id === SYSTEM_USER_ID
        );
      }

      return enhancedData;
    } catch (error) {
      console.error("Error fetching export data:", error);
      throw error;
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

  const hasPermissionToViewRequestorColumns = () => {
    const allowedRoles = [
      "manager",
      "manager_patient",
      "manager_translator",
      "admin",
    ];
    return allowedRoles.includes(currentUserRole);
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
    return parseInt(b.request_id) - parseInt(a.request_id);
  });
    const currentUser = localStorage.getItem("fullName");
  const currentDateTime = new Date()
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  // Replace the renderActionButtons function with this updated version
  const renderActionButtons = (request) => {
    const isProcessing = processingId === request.request_id;

    const showCancelButton =
      request.status !== "finished" && request.status !== "evaluated";

    const showAcceptButton =
      request.status === "pending" || request.status === "created";

    const showFinishButton = request.status === "accepted";

    const showEvaluateButton =
      request.status === "finished" &&
      (currentUserRole === "manager" ||
        currentUserRole === "admin" ||
        currentUserRole === "manager_patient");

    const showResultsButton =
      request.status === "evaluated" &&
      (currentUserRole === "manager" ||
        currentUserRole === "admin" ||
        currentUserRole === "manager_patient");

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
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Finish"}
          </button>
        )}

        {showEvaluateButton && (
          <button
            className="btn btn-info"
            onClick={() => {
              setSelectedRequestForEvaluation(request);
              setEvaluationModalOpen(true);
            }}
            disabled={isProcessing}
            style={{ marginRight: "5px" }}
          >
            {isProcessing ? "Processing..." : "Evaluate Staff"}
          </button>
        )}

        {showResultsButton && (
          <button
            className="btn btn-secondary"
            onClick={async () => {
              try {
                const results = await getEvaluationResults(request.request_id);
                setEvaluationData(results);
                setEvaluationResultsModalOpen(true);
              } catch (error) {
                alert("Error fetching evaluation results: " + error.message);
              }
            }}
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "View Evaluation"}
          </button>
        )}
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
            translatorOptions={translatorOptions}
            escortRequests={requests}
            onRefreshData={refreshTranslatorData}
          />
          {(currentUserRole === "manager" ||
            currentUserRole === "manager_patient" ||
            currentUserRole === "user") && (
            <button
              className="btn btn-export"
              onClick={() => setExportModalOpen(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                background: "linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)",
                color: "white",
                boxShadow: "0 3px 5px 2px rgba(33, 203, 243, .3)",
              }}
            >
              <i className="fas fa-file-export"></i>
              Export Data
            </button>
          )}
        </div>
      </div>

      {currentUserRole !== "patient_escort" && (
  <div className="dashboard">
    <div className="card">
      <h3>Pending Requests</h3>
      <div className="metric" id="pendingRequests">
        {
          filterRequestsByDate(requests, selectedDate).filter(
            (r) => r.status === "pending" || r.status === "created"
          ).length
        }
      </div>
    </div>

    <div className="card">
      <h3>Completed</h3>
      <div className="metric">
        {
          filterRequestsByDate(requests, selectedDate).filter(
            (r) => r.status === "finished"
          ).length
        }
      </div>
    </div>

    <div className="card">
      <h3>Success Rate</h3>
      <div className="metric" id="-">
        {
          (() => {
            const filteredRequests = filterRequestsByDate(requests, selectedDate);
            const filtered_completedRequests = filteredRequests.filter(
              (r) => r.status === "finished"
            ).length;
            const filtered_totalRequests = filteredRequests.length;
            const filtered_completionRate =
              filtered_totalRequests > 0
                ? Math.round((filtered_completedRequests / filtered_totalRequests) * 100)
                : 0;
            return parseFloat(filtered_completionRate).toFixed(2) + '%';
          })()
        }
      </div>
    </div>

    <div className="card">
      <h3>Avg. Handling Time</h3>
      <div className="metric" id="patientEscortAvgResponseTime">
        {(() => {
          const filteredRequests = filterRequestsByDate(requests, selectedDate);
          
          if (filteredRequests.length === 0) return "- mins";

          let totalMinutes = 0;
          let countableRequests = 0;

          filteredRequests.forEach((request) => {
            if (request.request_time && request.request_date) {
              totalMinutes += calculateHandlingTimeInMinutes(
                request.request_time,
                request.request_date,
                request.last_finish
              );
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
        })()}
      </div>
    </div>
  </div>
)}

      {/* ตาราง My Requests */}
      <div className="request-panel">
        <div className="request-header">
          <h2>My Requests</h2>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <DatePicker
                label="Filter by date"
                value={selectedDate}
                onChange={(newDate) => setSelectedDate(newDate)}
                renderInput={(props) => <TextField {...props} size="small" />}
                slotProps={{
                  textField: {
                    size: "small",
                    sx: { width: "200px" },
                  },
                }}
              />
            </Box>
          </LocalizationProvider>
        </div>

        {isLoading && !processingId ? (
          <div className="loading">Loading requests...</div>
        ) : requests.length === 0 ? (
          <div className="no-data">No requests found</div>
        ) : (
          Object.entries(
            // Apply the date filter before grouping
            filterRequestsByDate(sortedRequests, selectedDate).reduce(
              (groups, request) => {
                const date = request.request_date;
                if (!groups[date]) {
                  groups[date] = [];
                }
                groups[date].push(request);
                return groups;
              },
              {}
            )
          )
            .sort(([dateA], [dateB]) => new Date(dateB) - new Date(dateA))
            .map(([date, dateRequests]) => (
              <div key={date} className="date-section">
                <div className="date-header">
                  {new Date(date).toLocaleDateString("th-TH", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>
                <table className="tracking-table">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Patient Name</th>
                      {hasPermissionToViewRequestorColumns() && (
                        <th>Requestor</th>
                      )}
                      {hasPermissionToViewRequestorColumns() && (
                        <th>Requested By</th>
                      )}
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
                    {dateRequests.map((request) => (
                      <tr key={request.request_id}>
                        <td>{request.request_id}</td>
                        <td>{request.patient_hn}</td>
                        {hasPermissionToViewRequestorColumns() && (
                          <td>{request.staff_name}</td>
                        )}
                        {hasPermissionToViewRequestorColumns() && (
                          <td>{request.requestor}</td>
                        )}
                        <td>{request.base_service_point_id}</td>
                        <td>{request.priority || "-"}</td>
                        <td>{request.request_type}</td>
                        <td>
                          {calculateHandlingTime(
                            request.request_time,
                            request.request_date,
                            request.last_finish
                          )}
                        </td>
                        <td>{formatItemDisplay(request.item)}</td>
                        <td>
                          <span
                            className={`status-indicator ${
                              request.status.toLowerCase() === "evaluated"
                                ? "evaluated"
                                : request.status.toLowerCase() === "finished" ||
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
                    ))}
                  </tbody>
                </table>
              </div>
            ))
        )}
      </div>

     <EvaluationModal
        open={evaluationModalOpen}
        handleClose={() => setEvaluationModalOpen(false)}
        request={selectedRequestForEvaluation}
        onSubmitEvaluation={handleSubmitEvaluation}
        currentUser={SYSTEM_USER_ID}
      />
    {/* Evaluation Results Modal */}
      <EvaluationResultsModal
        open={evaluationResultsModalOpen}
        handleClose={() => setEvaluationResultsModalOpen(false)}
        evaluationData={evaluationData}
      />
    <ExportModal
        open={exportModalOpen}
        handleClose={() => setExportModalOpen(false)}
        exportData={handleExportData}
        title="ส่งออกข้อมูล Patient Escort"
      />
   </div>
  );
};

export default Patient;
