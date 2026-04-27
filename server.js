const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { connectDB, sequelize } = require("./config/db");

// Routes
const userRoutes = require("./routes/userRoute");
const guestRoutes = require("./routes/guestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const emergencyTypeRoutes = require("./routes/emergencyTypeRoutes");
const agencyTypeRoutes = require("./routes/agencyTypeRoutes");
const agencyRoutes = require("./routes/agencyRoutes");
const kebeleRoutes = require("./routes/kebeleRoutes");
const responderTeamRoutes = require("./routes/responderTeamRoutes");
const crewRoleRoutes = require("./routes/crewRoleRoutes");
const crewRoutes = require("./routes/crewRoutes");
const caseTypeRoutes = require("./routes/caseTypeRoutes");
const casesRoutes = require("./routes/casesRoutes");
const serviceTypeRoutes = require("./routes/serviceTypeRoutes");
const serviceCategoryRoutes = require("./routes/serviceCategoryRoutes");
const serviceRoutes = require("./routes/serviceRoutes");
const caseReportsRoutes = require("./routes/caseReportsRoutes");
const emergedRoutes = require("./routes/emergedRoutes");
const messageRoutes = require("./routes/messageRoutes"); // Consistently using Message

// Socket logic & Middleware
const chatSocket = require("./socket/chatSocket");
const socketAuth = require("./middleware/socketAuth");

const app = express();

/**
 * ======================
 * EXPRESS MIDDLEWARE
 * ======================
 */
app.use(express.json());
app.use(
  cors({
    origin: /http:\/\/localhost:\d+/,
    credentials: true,
  }),
);

app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));
app.use("/public", express.static("public"));

const server = http.createServer(app);

/**
 * ======================
 * SOCKET.IO SETUP
 * ======================
 */
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

// Authenticate socket connections (User vs Guest)
io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(`CONNECTED: ${socket.identity.name} (${socket.identity.role})`);

  // Pass the socket to the handler
  chatSocket(io, socket);
});

/**
 * ======================
 * HEALTH CHECK
 * ======================
 */
app.get("/", (req, res) => res.send("BahirLink Backend is running!"));

/**
 * ======================
 * REST ROUTES
 * ======================
 */
app.use("/api/users", userRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/emergencyType", emergencyTypeRoutes);
app.use("/api/agencyType", agencyTypeRoutes);
app.use("/api/agency", agencyRoutes);
app.use("/api/kebele", kebeleRoutes);
app.use("/api/responderTeam", responderTeamRoutes);
app.use("/api/crewRole", crewRoleRoutes);
app.use("/api/crew", crewRoutes);
app.use("/api/caseType", caseTypeRoutes);
app.use("/api/cases", casesRoutes);
app.use("/api/serviceType", serviceTypeRoutes);
app.use("/api/serviceCategory", serviceCategoryRoutes);
app.use("/api/service", serviceRoutes);
app.use("/api/caseReports", caseReportsRoutes);
app.use("/api/emerged", emergedRoutes);
app.use("/api/message", messageRoutes); // Centralized messaging endpoint

/**
 * ======================
 * START SERVER
 * ======================
 */
const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    // Alter: true will update your Neon DB with the new 'isChatEnabled' column
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("Database models synchronized.");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("Database initialization failed:", err);
    process.exit(1);
  });
