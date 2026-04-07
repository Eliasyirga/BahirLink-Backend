const {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
} = require("../services/emergencyService");

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergencyHandler = async (req, res) => {
  try {
    const emergency = await createGuestEmergency(req.body, req.file);
    res.status(201).json({ success: true, data: emergency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const userId = req.user?.id;
    const isGuest = !!req.query.guestId;
    const id = userId || req.query.guestId;

    const emergencies = await getEmergencies(id, isGuest);
    res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET EMERGENCIES FOR RESPONDER TEAM
// =========================
const getEmergenciesForResponderTeamHandler = async (req, res) => {
  try {
    const { responderTeamId } = req.params;
    if (!responderTeamId)
      return res
        .status(400)
        .json({ success: false, message: "Responder Team ID is required" });

    const emergencies = await getEmergenciesForResponderTeam(responderTeamId);
    res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    const emergencies = await emergencyService.getAllEmergenciesForAdmin();
    res.json({ success: true, data: emergencies });
  } catch (err) {
    console.error("❌ Error fetching all emergencies for admin:", err);
    res.status(500).json({ success: false, error: err.message });
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
