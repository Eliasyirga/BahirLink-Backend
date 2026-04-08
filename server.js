const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const { connectDB, sequelize } = require("./config/db");

const userRoutes = require("./routes/userRoute");
const verifyRoutes = require("./routes/userRoute");
const guestRoutes = require("./routes/guestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");
const chatSocket = require("./socket/chatSocket");
const socketAuth = require("./middleware/socketAuth");
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

const app = express();

app.use(
  cors({
    origin: /http:\/\/localhost:\d+/,
    credentials: true,
  }),
);
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log("CONNECTED:", socket.identity);

  chatSocket(io, socket);
});

app.use(express.json());

// If your images are in a folder named 'uploads'
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.use("/public", express.static("public"));

app.get("/", (req, res) => res.send("Backend is running!"));

app.use("/api/users", userRoutes);
// app.use("/api/verify", verifyRoutes);
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

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    app.use("/api/kebele", kebeleRoutes);

    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("All models synced to PostgreSQL (Neon)");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("PostgreSQL connection error:", err));
