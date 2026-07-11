const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const users = {
  admin1: { id: "1", fullName: "Admin User", empType: "admin" },
  manager1: { id: "2", fullName: "Manager User", empType: "manager" },
  user: { id: "3", fullName: "Staff User", empType: "staff" },
  patient1: { id: "4", fullName: "Patient User", empType: "patient" },
  translator1: { id: "5", fullName: "Translator User", empType: "translator" }
};

app.post("/api/Login/Login", (req, res) => {
  const { Username, Password } = req.body;
  console.log(`[Mock Server] Login attempt: ${Username}`);
  
  if (users[Username] && Password === "mypassword") {
    // Generate a simple mock token that contains the username
    const mockToken = Buffer.from(`mock-token-for-${Username}`).toString('base64');
    return res.json({ Token: mockToken });
  }
  
  return res.status(401).json({ message: "Invalid credentials" });
});

app.get("/api/Login/me", (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const decodedStr = Buffer.from(token, 'base64').toString('utf-8');
  const username = decodedStr.replace('mock-token-for-', '');
  
  const user = users[username];
  if (user) {
    return res.json(user);
  }
  
  return res.status(401).json({ message: "Invalid token" });
});

const PORT = 5025;
app.listen(PORT, () => {
  console.log(`[Mock Server] API running on http://localhost:${PORT}`);
});
