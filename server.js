const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB, sequelize } = require("./config/db"); // Sequelize connection

// Routes
const userRoutes = require("./routes/userRoute");
const verifyRoutes = require("./routes/userRoute"); // or create a separate verifyRoute

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

// User routes
app.use("/api/users", userRoutes);
// app.use("/api/verify", verifyRoutes);

// Connect PostgreSQL (Neon) and start server
const PORT = process.env.PORT || 5000;

connectDB() // authenticate Sequelize
  .then(() => {
    // Sync all Sequelize models (creates tables if not exist)
    return sequelize.sync({ alter: true }); // use { force: true } to drop & recreate tables
  })
  .then(() => {
    console.log("All models synced to PostgreSQL (Neon)");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("PostgreSQL connection error:", err));
