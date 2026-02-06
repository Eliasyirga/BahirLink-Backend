const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { connectDB, sequelize } = require("./config/db"); 

const userRoutes = require("./routes/userRoute");
const verifyRoutes = require("./routes/userRoute"); 
const guestRoutes = require("./routes/guestRoutes");
const emergencyRoutes = require("./routes/emergencyRoutes");



const app = express();

// CORS
app.use(
  cors({
    origin: /http:\/\/localhost:\d+/, // allow any localhost port
    credentials: true,
  })
);


app.use(express.json());

// Serve static files
app.use("/public", express.static("public"));


app.get("/", (req, res) => res.send("Backend is running!"));


app.use("/api/users", userRoutes);
// app.use("/api/verify", verifyRoutes);
app.use("/api/guests", guestRoutes);
app.use("/api/emergencies", emergencyRoutes); 


const PORT = process.env.PORT || 5000;

connectDB() 
  .then(() => {

    return sequelize.sync({ alter: true });
  })
  .then(() => {
    console.log("All models synced to PostgreSQL (Neon)");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => console.error("PostgreSQL connection error:", err));
