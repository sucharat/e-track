require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("./backend/models/user.model");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/loginDB")
  .then(() => console.log("[MongoDB] Connected to loginDB"))
  .catch(err => console.error("[MongoDB] Connection error:", err));

const SECRET_KEY = process.env.JWT_SECRET || "supersecretkey";

// Login API
app.post("/api/Login/Login", async (req, res) => {
  try {
    const { Username, Password } = req.body;
    console.log(`[API] Login attempt: ${Username}`);

    const user = await User.findOne({ username: Username });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(Password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Include username and id in token payload
    const token = jwt.sign({ id: user._id, username: user.username }, SECRET_KEY, { expiresIn: "8h" });
    res.json({ Token: token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// Get Me API
app.get("/api/Login/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, SECRET_KEY);

    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      id: user._id,
      fullName: user.fullName,
      empType: user.empType,
      username: user.username
    });
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Invalid token" });
  }
});

// Mock API Endpoints for ETrack
app.get("/api/ETrack/OnGetEquipment", (req, res) => res.json([]));
app.get("/api/ETrack/OnGetStaff", (req, res) => res.json([]));
app.get("/api/ETrack/OnGetEtrackRequest", (req, res) => res.json([]));
app.post("/api/ETrack/OnInsertRequest", (req, res) => res.json({ success: true }));
app.delete("/api/ETrack/OnDeleteEtrackRequest/:id", (req, res) => res.json({ success: true }));
app.put("/api/ETrack/OnUpdateETrack", (req, res) => res.json({ success: true }));

// Mock API Endpoints for Notifications
app.get("/api/Notification", (req, res) => res.json([]));
app.get("/api/Notification/all", (req, res) => res.json([]));
app.get("/api/Notification/:id", (req, res) => res.json({ id: req.params.id, message: "Mock notification" }));
app.put("/api/Notification/MarkAsRead/:id", (req, res) => res.json({ success: true }));

const PORT = 5025;
app.listen(PORT, () => {
  console.log(`[Server] API running on http://localhost:${PORT}`);
});
