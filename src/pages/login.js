
import React, { useEffect, useState } from "react";
import { encryptData, getLocalData } from "../helper/help";
import { useNavigate } from 'react-router-dom';

function Login() {
  const [userId, setUserId] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

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
  
    console.log("Response จาก Login API:", response);
  
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
  
    console.log("Response จาก user/me:", userResponse);
  
    if (userResponse.status === 200) {
      const userData = await userResponse.json();
      console.log("User Data:", userData);
  
      localStorage.setItem("empType", userData.empType);
      localStorage.setItem("fullName", userData.fullName);
      localStorage.setItem("userId", userData.id);

  
      navigate("/e-track")
      
    } else {
      alert("ไม่สามารถดึงข้อมูลผู้ใช้ได้");
    }
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
          <div>2025-03-02 12:19:55</div>
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
                <td style={{ padding: "3px 0" }}><strong> Admin: </strong></td>
                <td>admin1 / mypassword</td>
              </tr>

            <tr>
                <td style={{ padding: "3px 0" }}><strong> Manager: </strong></td>
                <td>manager1 / mypassword</td>
              </tr>

              <tr>
                <td style={{ padding: "3px 0" }}><strong> Staff: </strong></td>
                <td>user / mypassword</td>
              </tr>

              <tr>
                <td style={{ padding: "3px 0" }}><strong> Patient: </strong></td>
                <td>patient1 / mypassword</td>
              </tr>


              <tr>
                <td style={{ padding: "3px 0" }}><strong> Translator: </strong></td>
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

          <div style={{ marginBottom: "20px" }}>
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

            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน"
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
              transition: "background-color 0.15s ease-in-out"
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