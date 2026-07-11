const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./backend/models/user.model");

const testUsers = [
  { username: "admin1", password: "mypassword", fullName: "Admin User", empType: "admin" },
  { username: "manager1", password: "mypassword", fullName: "Manager User", empType: "manager" },
  { username: "user", password: "mypassword", fullName: "Staff User", empType: "staff" },
  { username: "patient1", password: "mypassword", fullName: "Patient User", empType: "patient" },
  { username: "translator1", password: "mypassword", fullName: "Translator User", empType: "translator" }
];

async function seed() {
  try {
    await mongoose.connect("mongodb://localhost:27017/loginDB");
    console.log("Connected to MongoDB...");

    // Clear existing users
    await User.deleteMany({});
    console.log("Cleared existing users.");

    // Hash passwords and insert
    for (const u of testUsers) {
      const hashedPassword = await bcrypt.hash(u.password, 10);
      const newUser = new User({ ...u, password: hashedPassword });
      await newUser.save();
    }
    
    console.log("Database seeded successfully with test users!");
  } catch (err) {
    console.error("Seeding error:", err);
  } finally {
    mongoose.connection.close();
  }
}

seed();
