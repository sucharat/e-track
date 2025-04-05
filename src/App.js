import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Manager from "./pages/ETrack/Manager";
import Patient from "./pages/ETrack/Patient";
import IntCoordTab from "./pages/ETrack/IntCoordTab";
import Notification from "./pages/ETrack/Notification";
import { url, encryptData, decryptData, getLocalData } from "./helper/help";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("");
  const [empType, setEmpType] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [userInfo, setUserInfo] = useState({
    fullName: "",
    userId: "",
    role: ""
  });
  const [currentTime, setCurrentTime] = useState(formatLocalDateTime(new Date()));

  const navigate = useNavigate();

  function formatLocalDateTime(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  const getActiveTabFromEmpType = (type) => {
    switch (type) {
      case "admin":
      case "manager":
        return "manager";
      case "patient_escort":
      case "manager_patient":
        return "patient";
      case "translator":
      case "manager_translator":
        return "intCoordTab";
      case "user":
        return "patient"; 
      default:
        return "";
    }
  };

  useEffect(() => {
    const storedEmpType = localStorage.getItem("empType");
    const fullName = localStorage.getItem("fullName");
    const userId = localStorage.getItem("userId");

    if (!storedEmpType) {
      navigate("/");
    } else {
      setEmpType(storedEmpType);

      setActiveTab(getActiveTabFromEmpType(storedEmpType));
      
      setUserInfo({
        fullName: fullName || "User",
        userId: userId || "",
        role: storedEmpType || ""
      });
      
      // Fetch notification count initially
      fetchUnreadNotificationCount();
    }
    // Update time every second
    const timer = setInterval(() => {
      setCurrentTime(formatLocalDateTime(new Date()));
    }, 1000);
    
    return () => clearInterval(timer);
  }, [navigate]);

  // Fetch unread notification count periodically
  useEffect(() => {
    if (!userInfo.userId) return;

    const intervalId = setInterval(() => {
      fetchUnreadNotificationCount();
    }, 30000);
    return () => clearInterval(intervalId);
  }, [userInfo.userId]);

  const fetchUnreadNotificationCount = async () => {
    try {
      const token = getLocalData("token");
      
      if (!token) return;
      
      const response = await axios.get(`${url}/api/Notification?status=unread&limit=0&markAsRead=false`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success) {
        setUnreadCount(response.data.count || 0);
      }
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  const handleNotificationsViewed = (count) => {
    setUnreadCount(count || 0);
  };

  const handleLogout = () => {
    const encryptedTokenKey = encryptData("token");
    localStorage.removeItem(encryptedTokenKey);
    localStorage.removeItem("empType");
    localStorage.removeItem("fullName");
    localStorage.removeItem("userId");
    setEmpType("");
    setActiveTab("");
    setUserInfo({
      fullName: "",
      userId: "",
      role: ""
    });
    navigate("/");
  };

  return (
    <div className="container" id="mainContainer">
      {/* Header bar with user info */}
      {activeTab && (
        <div className="top-bar">
<div className="left-side">
  <div className="app-title text-5xl font-extrabold text-blue-700">BPK E-Track</div>
</div>
          
          <div className="user-info-container">
            <div className="current-datetime">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span>{currentTime}</span>
            </div>
            
            <div className="user-info">
              <div className="user-details">
                <span className="user-name">{userInfo.fullName}</span>
                {userInfo.userId && (
                  <span className="user-id">ID: {userInfo.userId}</span>
                )}
                {userInfo.role && (
                  <span className="user-role">{userInfo.role}</span>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="logout-button"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      {activeTab && (
        <div className="tabs">
          <button
            className={activeTab === "notification" ? "active" : ""}
            onClick={() => setActiveTab("notification")}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            Notification
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </button>

          {empType === "manager" || empType === "admin" ? (
            <>
              <button
                className={activeTab === "manager" ? "active" : ""}
                onClick={() => setActiveTab("manager")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                  <polyline points="9 22 9 12 15 12 15 22"></polyline>
                </svg>
                Manager View
              </button>

              <button
                className={activeTab === "patient" ? "active" : ""}
                onClick={() => setActiveTab("patient")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Patient Escort View
              </button>

              <button
                className={activeTab === "intCoordTab" ? "active" : ""}
                onClick={() => setActiveTab("intCoordTab")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Translator View
              </button>
            </>
          ) : empType === "user" ? (
            <>
              <button
                className={activeTab === "patient" ? "active" : ""}
                onClick={() => setActiveTab("patient")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                  <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                </svg>
                Patient Escort View
              </button>

              <button
                className={activeTab === "intCoordTab" ? "active" : ""}
                onClick={() => setActiveTab("intCoordTab")}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                </svg>
                Translator View
              </button>
            </>
          ) : (
            <>
              {(empType === "patient_escort" ||
                empType === "manager_patient") && (
                <button
                  className={activeTab === "patient" ? "active" : ""}
                  onClick={() => setActiveTab("patient")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
                  </svg>
                  Patient Escort View
                </button>
              )}

              {(empType === "translator" ||
                empType === "manager_translator") && (
                <button
                  className={activeTab === "intCoordTab" ? "active" : ""}
                  onClick={() => setActiveTab("intCoordTab")}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                  </svg>
                  Translator View
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="tab-content">
        {activeTab === "notification" && <Notification onNotificationsViewed={handleNotificationsViewed} />}
        {activeTab === "manager" && <Manager />}
        {activeTab === "patient" && <Patient />}
        {activeTab === "intCoordTab" && <IntCoordTab />}
      </div>
    </div>
  );
}

export default App;