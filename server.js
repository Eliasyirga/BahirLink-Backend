const express = require("express");
const cors = require("cors");
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

app.use("/public", express.static("public"));

app.get("/", (req, res) => res.send("Backend is running!"));

app.use("/api/users", userRoutes);
// app.use("/api/verify", verifyRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/emergencies", emergencyRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/emergencyType", emergencyTypeRoutes);

const PORT = process.env.PORT || 5000;

connectDB()
  .then(() => {
    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("All models synced to PostgreSQL (Neon)");
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("PostgreSQL connection error:", err));
