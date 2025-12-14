const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

// Existing routes
const userRoutes = require("./routers/userRoute");

// New verification route
const verifyRoutes = require("./routers/userRoute"); // <-- create this file as explained earlier

const app = express();

// CORS
app.use(
  cors({
    origin: /http:\/\/localhost:\d+/, // allow any localhost port
    credentials: true,
  })
);

// Parse JSON
app.use(express.json());

// Serve static files
app.use("/public", express.static("public"));

// Test route
app.get("/", (req, res) => res.send("Backend is running!"));

// Existing user routes
app.use("/api/users", userRoutes);

// New verification route
app.use("/api/verify", verifyRoutes);

// Connect MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(5000, () => console.log("Server running on port 5000"));
  })
  .catch((err) => console.error("MongoDB Error:", err));
