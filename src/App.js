import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Manager from "./pages/ETrack/Manager";
import Patient from "./pages/ETrack/Patient";
import IntCoordTab from "./pages/ETrack/IntCoordTab";
import { encryptData, decryptData } from "./helper/help";
import "./App.css";

function App() {
  const [activeTab, setActiveTab] = useState("");
  const [empType, setEmpType] = useState("");
  const navigate = useNavigate();

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
        return "patient"; // Default view for user role
      default:
        return "";
    }
  };

  useEffect(() => {
    const storedEmpType = localStorage.getItem("empType");

    if (!storedEmpType) {
      navigate("/");
    } else {
      setEmpType(storedEmpType);

      setActiveTab(getActiveTabFromEmpType(storedEmpType));
    }
  }, [navigate]);

  const handleLogout = () => {
    const encryptedTokenKey = encryptData("token");
    localStorage.removeItem(encryptedTokenKey);
    localStorage.removeItem("empType");
    setEmpType("");
    setActiveTab("");
    navigate("/");
  };

  return (
    <div className="container" id="mainContainer">
      {/* ปุ่ม Logout */}
      {activeTab && (
        <button
          onClick={handleLogout}
          style={{
            position: "absolute",
            top: "10px",
            right: "10px",
            padding: "8px 15px",
            backgroundColor: "#ff4d4d",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      )}

      {/* Tabs */}
      {activeTab && (
        <div className="tabs">
          {empType === "manager" || empType === "admin" ? (
            <>
              <button
                className={activeTab === "manager" ? "active" : ""}
                onClick={() => setActiveTab("manager")}
              >
                Manager View
              </button>

              <button
                className={activeTab === "patient" ? "active" : ""}
                onClick={() => setActiveTab("patient")}
              >
                Patient Escort View
              </button>

              <button
                className={activeTab === "intCoordTab" ? "active" : ""}
                onClick={() => setActiveTab("intCoordTab")}
              >
                Translator View
              </button>
            </>
          ) : empType === "user" ? (
            <>
              <button
                className={activeTab === "patient" ? "active" : ""}
                onClick={() => setActiveTab("patient")}
              >
                Patient Escort View
              </button>

              <button
                className={activeTab === "intCoordTab" ? "active" : ""}
                onClick={() => setActiveTab("intCoordTab")}
              >
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
                  Patient Escort View
                </button>
              )}

              {(empType === "translator" ||
                empType === "manager_translator") && (
                <button
                  className={activeTab === "intCoordTab" ? "active" : ""}
                  onClick={() => setActiveTab("intCoordTab")}
                >
                  Translator View
                </button>
              )}
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div className="tab-content">
        {activeTab === "manager" && <Manager />}
        {activeTab === "patient" && <Patient />}
        {activeTab === "intCoordTab" && <IntCoordTab />}
      </div>
    </div>
  );
}

export default App;