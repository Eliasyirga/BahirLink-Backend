const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const http = require("http");
const { Server } = require("socket.io");

const { connectDB, sequelize } = require("./config/db");
require("./models"); // register every model + association before migrations/sync
const { ensureColumns } = require("./migrations/ensureColumns");

// --- Route Imports ---
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
const finalReportRoutes = require("./routes/finalReportRoutes");
// Heavy verification deps (OCR/face) are loaded lazily inside the handler.
const verifyRoutes = require("./routes/verifyRoutes");
const translationRoutes = require("./routes/translationRoutes");

const chatSocket = require("./socket/chatSocket");
const videoCallSocket = require("./socket/videoCallSocket");
const socketAuth = require("./middleware/socketAuth");
const langMiddleware = require("./middleware/lang.middleware");

// --- CORS allow-list ---------------------------------------------------------
// CORS_ORIGINS: comma-separated list of allowed browser origins.
// TODO: add the production web origin (e.g. the Vercel/Netlify URL of
// bahirdarLink_web, and the Flutter web build if deployed) via CORS_ORIGINS
// on Render — it could not be determined from the repos.
const DEFAULT_CORS_ORIGINS = ["http://localhost:5173", "http://localhost:3000"];
const allowedOrigins = (process.env.CORS_ORIGINS || "")
  .split(",")
  .map((o) => o.trim().replace(/\/$/, ""))
  .filter(Boolean);
const corsOrigins = allowedOrigins.length ? allowedOrigins : DEFAULT_CORS_ORIGINS;

// Requests without an Origin header (mobile app, curl, server-to-server) are
// allowed; browser requests must come from an allow-listed origin.
const corsOriginCheck = (origin, callback) => {
  if (!origin || corsOrigins.includes(origin)) return callback(null, true);
  return callback(null, false);
};

const app = express();
// Render terminates TLS in front of us; needed for correct client IPs
// (rate limiting) and req.secure.
app.set("trust proxy", 1);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: corsOriginCheck,
    methods: ["GET", "POST"],
    credentials: true,
  },
});

io.use(socketAuth);

io.on("connection", (socket) => {
  console.log(
    `📡 Socket Connected: ${socket.identity.name} [${socket.identity.role}]`,
  );
  chatSocket(io, socket);
  videoCallSocket(io, socket);
});

app.use(express.json());
app.use(
  cors({
    origin: corsOriginCheck,
    credentials: true,
  }),
);

// Static File Serving — legacy uploaded media (image tags can't send auth
// headers). The rest of public/ is no longer exposed.
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

app.get("/", (req, res) =>
  res.send("BahirLink Mission-Critical Backend is Live."),
);

// Apply Translation Middleware to ALL /api routes
app.use("/api", langMiddleware);

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
app.use("/api/finalReport", finalReportRoutes);
app.use("/api/verify", verifyRoutes); // verifyToken + type "user" inside
app.use("/api/translation", translationRoutes); // public, rate-limited (Gemini)

app.use("/api/message", require("./routes/messageRoutes")(io));

app.use((err, req, res, next) => {
  console.error("❌ System Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: process.env.NODE_ENV === "development" ? err.message : {},
  });
});

const PORT = process.env.PORT || 5000;

connectDB()
  // Additive, idempotent column fixes BEFORE sync (see migrations/ensureColumns.js).
  .then(() => ensureColumns(sequelize))
  // Schema is managed by sync() WITHOUT alter: it only creates missing tables.
  .then(() => sequelize.sync())
  .then(() => {
    console.log("Database Synced to Neon.");
    server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("🛑 Startup Failure:", err);
    process.exit(1);
  });
