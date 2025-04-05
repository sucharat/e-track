
import React, { useEffect, useState } from "react";
import { encryptData, getLocalData } from "../helper/help";
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Import icons for the password toggle

function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [currentTime, setCurrentTime] = useState("");
  const navigate = useNavigate();

  // Function to update current time in Thai timezone
  useEffect(() => {
    const updateTime = () => {
      const options = {
        timeZone: 'Asia/Bangkok',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      };

      const thaiTime = new Date().toLocaleString('th-TH', options);
      setCurrentTime(thaiTime);
    };

    // Update time immediately and then every second
    updateTime();
    const timer = setInterval(updateTime, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    var token = getLocalData("token");
    if (token) {
      navigate("/e-track");
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!userId || !password) {
      alert("กรุณากรอก User ID และ Password");
      return;
    }
  
    await OnCallLogin(userId, password);
  };
  
  const OnCallLogin = async (username, password) => {
    const data = {
      Username: username,
      Password: password,
    };
  
    console.log("ส่งข้อมูลไป Login API:", data);
  
    const response = await fetch("http://localhost:5025/api/Login/Login", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      alert("Login ไม่สำเร็จ: " + response.status);
      return;
    }
  
    const result = await response.json();
    console.log(" Token ที่ได้:", result.Token);
  
    localStorage.setItem(encryptData("token"), encryptData(result.Token));

    const userResponse = await fetch("http://localhost:5025/api/Login/me", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${result.Token}`,
        "Content-Type": "application/json",
      },
    });

    if (userResponse.status === 200) {
      const userData = await userResponse.json();
      console.log("User Data:", userData);
  
      localStorage.setItem("empType", userData.empType);
      localStorage.setItem("fullName", userData.fullName);
      localStorage.setItem("userId", userData.id);

      navigate("/e-track");
      
    } else {
      alert("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      }}
    >
      <div
        style={{
          border: "none",
          padding: "30px",
          borderRadius: "10px",
          backgroundColor: "white",
          boxShadow: "0 8px 20px rgba(0,0,0,0.1)",
          width: "400px",
        }}
      >
        {/* System Date and User Info */}
        <div style={{ 
          textAlign: "right", 
          fontSize: "12px", 
          color: "#888",
          marginBottom: "20px" 
        }}>
          <div>{currentTime}</div>
        </div>

        <h2 style={{ 
          textAlign: "center", 
          color: "#333",
          marginBottom: "30px",
          fontWeight: "500"
        }}>เข้าสู่ระบบ</h2>

        {/* Test Login Credentials */}
        <div style={{ 
          backgroundColor: "#f8f9fa", 
          padding: "18px", 
          borderRadius: "5px",
          marginBottom: "20px",
          fontSize: "14px",
          border: "1px solid #e9ecef"
          }}>
          <p style={{ margin: "0 0 5px 0", fontWeight: "bold", color: "#495057" }}>ข้อมูลสำหรับทดสอบ:</p>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              <tr>
                <td style={{ padding: "3px 0" }}><strong>Admin: </strong></td>
                <td>admin1 / mypassword</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}><strong>Manager: </strong></td>
                <td>manager1 / mypassword</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}><strong>Staff: </strong></td>
                <td>user / mypassword</td>
              </tr>
              <tr>
                <td style={{ padding: "3px 0" }}><strong>Patient: </strong></td>
                <td>patient1 / mypassword</td>
              </tr> 
              <tr>
                <td style={{ padding: "3px 0" }}><strong>Translator: </strong></td>
                <td>translator1 / mypassword</td>
              </tr> 
            </tbody>
          </table>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <label 
              htmlFor="userId"
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#495057",
                fontSize: "14px"
              }}
            >
              ชื่อผู้ใช้:
            </label>
            <input
              type="text"
              id="userId"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="กรอกชื่อผู้ใช้"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "4px",
                border: "1px solid #ced4da",
                fontSize: "16px",
                boxSizing: "border-box",
                transition: "border-color 0.15s ease-in-out"
              }}
            />
          </div>

          <div style={{ marginBottom: "20px", position: "relative" }}>
            <label 
              htmlFor="password"
              style={{
                display: "block",
                marginBottom: "8px",
                color: "#495057",
                fontSize: "14px"
              }}
            >
              รหัสผ่าน:
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="กรอกรหัสผ่าน"
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  paddingRight: "40px", // Space for the eye icon
                  borderRadius: "4px",
                  border: "1px solid #ced4da",
                  fontSize: "16px",
                  boxSizing: "border-box",
                  transition: "border-color 0.15s ease-in-out"
                }}
              />
              <button
                type="button"
                onClick={togglePasswordVisibility}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "5px",
                  color: "#6c757d"
                }}
              >
                {showPassword ? <FaEyeSlash size={20} /> : <FaEye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              backgroundColor: "#4361ee",
              color: "white",
              padding: "12px 15px",
              border: "none",
              borderRadius: "4px",
              cursor: "pointer",
              width: "100%",
              fontSize: "16px",
              fontWeight: "500",
              transition: "background-color 0.15s ease-in-out",
              ':hover': {
                backgroundColor: "#3451c6"
              }
            }}
          >
            เข้าสู่ระบบ
          </button>

        </form>
      </div>
    </div>
  );
}

export default Login;