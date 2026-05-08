const {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
  getAllEmergenciesForAdmin,
  updateEmergencyStatus,
  getEmergenciesByDeviceId,
  getEmergencyById,
} = require("../services/emergencyService");

/** Read Accept-Language from request headers. Defaults to 'en'. */
const getLang = (req) => req.headers["accept-language"] || "en";

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergencyHandler = async (req, res) => {
  try {
    const emergency = await createGuestEmergency(req.body, req.file);
    return res.status(201).json({
      success: true,
      message: "Emergency reported successfully",
      data: emergency,
    });
  } catch (error) {
    const statusCode =
      error.message.includes("required") || error.message.includes("Invalid")
        ? 400
        : 500;
    return res.status(statusCode).json({ success: false, message: error.message });
  }
};

// =========================
// CREATE USER EMERGENCY
// =========================
const createUserEmergencyHandler = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const emergency = await createUserEmergency(userId, req.body, req.file);
    return res.status(201).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// UPDATE EMERGENCY
// =========================
const updateEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // Pass isGuest flag from query if needed; default to false (user context)
    const isGuest = req.query.isGuest === "true";
    const userOrGuestId = req.user?.id || req.query.guestId;

    const emergency = await updateEmergency(
      userOrGuestId,
      id,
      req.body,
      req.file,
      isGuest
    );
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// DELETE EMERGENCY
// =========================
const deleteEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const isGuest = req.query.isGuest === "true";
    const userOrGuestId = req.user?.id || req.query.guestId;

    const result = await deleteEmergency(userOrGuestId, id, isGuest);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET USER/GUEST EMERGENCIES
// =========================
const getEmergenciesHandler = async (req, res) => {
  try {
    const { userOrGuestId } = req.params;
    const isGuest = req.query.isGuest === "true";
    const lang = getLang(req);

    const emergencies = await getEmergencies(userOrGuestId, isGuest, lang);
    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET EMERGENCIES FOR RESPONDER TEAM
// =========================
const getEmergenciesForResponderTeamHandler = async (req, res) => {
  try {
    const { responderTeamId } = req.params;
    const lang = getLang(req);

    if (!responderTeamId) {
      return res
        .status(400)
        .json({ success: false, message: "Responder Team ID is required" });
    }

    const emergencies = await getEmergenciesForResponderTeam(
      responderTeamId,
      lang
    );
    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgencyHandler = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const lang = getLang(req);

    if (!agencyId)
      return res
        .status(400)
        .json({ success: false, message: "Agency ID is required" });

    const emergencies = await getEmergenciesByAgency(agencyId, lang);
    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET ALL EMERGENCIES FOR ADMIN
// =========================
const getAllEmergenciesAdmin = async (req, res) => {
  try {
    const lang = getLang(req);
    const emergencies = await getAllEmergenciesForAdmin(lang);
    return res.json({ success: true, data: emergencies });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

// =========================
// GET SINGLE EMERGENCY BY ID
// =========================
const getEmergencyByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const lang = getLang(req);

    const emergency = await getEmergencyById(id, lang);

    if (!emergency) {
      return res
        .status(404)
        .json({ success: false, message: "Incident not found" });
    }

    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// UPDATE EMERGENCY STATUS
// =========================
const updateEmergencyStatusHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, report } = req.body;

    if (!status)
      return res
        .status(400)
        .json({ success: false, message: "Status is required" });

    const emergency = await updateEmergencyStatus(id, status, report);
    return res.status(200).json({
      success: true,
      message: "Status updated successfully",
      data: emergency,
    });
  } catch (error) {
    return res
      .status(error.message.includes("not found") ? 404 : 500)
      .json({ success: false, message: error.message });
  }
};

// =========================
// GET BY DEVICE ID
// =========================
const getEmergenciesByDeviceIdHandler = async (req, res) => {
  try {
    const { deviceId } = req.params;
    const lang = getLang(req);

    if (!deviceId)
      return res
        .status(400)
        .json({ success: false, message: "deviceId is required" });

    const emergencies = await getEmergenciesByDeviceId(deviceId, lang);
    return res.status(200).json({ success: true, data: emergencies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createGuestEmergencyHandler,
  createUserEmergencyHandler,
  updateEmergencyHandler,
  deleteEmergencyHandler,
  getEmergenciesHandler,
  getEmergencyByIdHandler,
  getEmergenciesForResponderTeamHandler,
  getEmergenciesByAgencyHandler,
  getAllEmergenciesAdmin,
  updateEmergencyStatusHandler,
  getEmergenciesByDeviceIdHandler,
};