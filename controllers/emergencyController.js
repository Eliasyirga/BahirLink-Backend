const {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
  getAllEmergenciesForAdmin,
} = require("../services/emergencyService");

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergencyHandler = async (req, res) => {
  try {
    // 1. Log incoming data for debugging (helpful for Flutter Web development)
    console.log("Incoming Guest Emergency Report:", {
      body: req.body,
      file: req.file ? req.file.filename : "No file attached",
    });

    // 2. Call the service
    // Ensure createGuestEmergency is the updated version that handles parseFloat for lat/lng
    const emergency = await createGuestEmergency(req.body, req.file);

    // 3. Return successful response
    return res.status(201).json({
      success: true,
      message: "Emergency reported successfully",
      data: emergency,
    });
  } catch (error) {
    // 4. Detailed Error Logging
    // This will show up in your Node.js console/terminal
    console.error("CRITICAL ERROR in createGuestEmergencyHandler:");
    console.error("Error Message:", error.message);
    console.error("Stack Trace:", error.stack);

    // 5. Categorize the error
    // If it's a validation error (like missing fields), we return 400
    // Otherwise, we return 500
    const statusCode =
      error.message.includes("required") || error.message.includes("Invalid")
        ? 400
        : 500;

    return res.status(statusCode).json({
      success: false,
      message: error.message || "An internal server error occurred",
    });
  }
};
// =========================
// CREATE USER EMERGENCY
// =========================
const createUserEmergencyHandler = async (req, res) => {
  try {
    const userId = req.user?.id; // assuming auth middleware
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const emergency = await createUserEmergency(userId, req.body, req.file);
    res.status(201).json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// UPDATE EMERGENCY
// =========================
const updateEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isGuest = !!req.body.guestId;

    const emergency = await updateEmergency(
      userId || req.body.guestId,
      id,
      req.body,
      req.file,
      isGuest,
    );
    res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// DELETE EMERGENCY
// =========================
const deleteEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const isGuest = !!req.body.guestId;

    const result = await deleteEmergency(
      userId || req.body.guestId,
      id,
      isGuest,
    );
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET USER/GUEST EMERGENCIES
// =========================
const getEmergenciesHandler = async (req, res) => {
  try {
    const { userOrGuestId } = req.params; // Make sure this matches your router param name
    const isGuest = req.query.guestId === "true";

    console.log(
      `Fetching emergencies for ${isGuest ? "Guest" : "User"}: ${userOrGuestId}`,
    );

    const emergencies = await getEmergencies(userOrGuestId, isGuest);
    res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    // THIS LOG IS CRITICAL - It will tell you the exact SQL or JS error
    console.error("DETAILED ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET EMERGENCIES FOR RESPONDER TEAM
// =========================
const getEmergenciesForResponderTeamHandler = async (req, res) => {
  try {
    const { responderTeamId } = req.params;

    if (!responderTeamId) {
      return res
        .status(400)
        .json({ success: false, message: "Responder Team ID is required" });
    }

    // Call the function we discussed earlier
    const emergencies = await getEmergenciesForResponderTeam(responderTeamId);

    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    console.error(error); // good for debugging
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgencyHandler = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!agencyId)
      return res
        .status(400)
        .json({ success: false, message: "Agency ID is required" });

    const emergencies = await getEmergenciesByAgency(agencyId);
    res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET ALL EMERGENCIES FOR ADMIN
// =========================
const getAllEmergenciesAdmin = async (req, res) => {
  try {
    const emergencies = await getAllEmergenciesForAdmin();

    return res.json({
      success: true,
      data: emergencies,
    });
  } catch (err) {
    console.error("❌ Error fetching all emergencies for admin:", err);
    return res.status(500).json({
      success: false,
      error: err.message,
    });
  }
};

module.exports = {
  createGuestEmergencyHandler,
  createUserEmergencyHandler,
  updateEmergencyHandler,
  deleteEmergencyHandler,
  getEmergenciesHandler,
  getEmergenciesForResponderTeamHandler,
  getEmergenciesByAgencyHandler,

  getAllEmergenciesAdmin,
};
