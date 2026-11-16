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
const { discardUploadedFile } = require("../utils/cloudinaryMedia");
const { localize } = require("../utils/localize");
const {
  isAllowed,
  isSystemAdmin,
  ADMIN_ROLES,
  STAFF_TYPES,
} = require("../middleware/auth");

const isStaff = (user) =>
  isAllowed(user, { userRoles: ADMIN_ROLES, types: STAFF_TYPES });

const errorStatus = (error, fallback = 500) => error.statusCode || fallback;

/** Read Accept-Language from request headers. Defaults to 'en'. */
const getLang = (req) => req.headers["accept-language"] || req.lang || "en";

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
    // ─── 🔍 CRITICAL DEBUG LOGS ───
    console.log("=========================================");
    console.error("❌ BACKEND CRASH DETECTED:");
    console.error(error); // Logs the complete error payload object
    if (error.stack) {
      console.error("📋 STACK TRACE:\n", error.stack); // Pinpoints the exact file and line number
    }
    console.log("=========================================");

    const statusCode =
      error.statusCode ||
      (error.message &&
      (error.message.includes("required") || error.message.includes("Invalid"))
        ? 400
        : 500);

    return res.status(statusCode).json({
      success: false,
      message: error.message || "Internal Server Error",
    });
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

    // The :userId URL param is ignored — the reporter is always the token's user.
    const emergency = await createUserEmergency(userId, req.body, req.file);
    return res.status(201).json({ success: true, data: emergency });
  } catch (error) {
    discardUploadedFile(req.file); // not saved — don't orphan the upload
    return res
      .status(errorStatus(error))
      .json({ success: false, message: error.message });
  }
};

// =========================
// UPDATE EMERGENCY  — PUT /api/emergencies/:userOrGuestId/:id
// Allowed body fields (Emergency model attribute names):
//   description, subdivision, street, kebeleId, emergencyTypeId, categoryId,
//   latitude + longitude (or location {latitude,longitude} / "lat,lng"), time,
//   optional multipart file field "media".
// Everything else (status, citizenId, guestId, isChatEnabled, report, ...) is
// ignored. Caller must be the citizen who owns the emergency, or an
// admin/serviceadmin user. The :userOrGuestId segment is not trusted.
// =========================
const updateEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = isSystemAdmin(req.user) ? null : req.user.id;

    const emergency = await updateEmergency(id, req.body, req.file, {
      citizenId,
    });
    return res.status(200).json({ success: true, data: emergency });
  } catch (error) {
    discardUploadedFile(req.file); // not saved — don't orphan the upload
    return res
      .status(errorStatus(error))
      .json({ success: false, message: error.message });
  }
};

// =========================
// DELETE EMERGENCY — owner citizen or admin/serviceadmin
// =========================
const deleteEmergencyHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const citizenId = isSystemAdmin(req.user) ? null : req.user.id;

    const result = await deleteEmergency(id, { citizenId });
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    return res
      .status(errorStatus(error))
      .json({ success: false, message: error.message });
  }
};

// =========================
// GET USER/GUEST EMERGENCIES
// Citizens may only read their own list; guest lists (isGuest=true) and
// other citizens' lists are staff-only.
// =========================
const getEmergenciesHandler = async (req, res) => {
  try {
    const { userOrGuestId } = req.params;
    const isGuest = req.query.isGuest === "true" || req.query.guestId === "true";
    const lang = getLang(req);

    const isOwner =
      !isGuest &&
      req.user.type === "user" &&
      String(req.user.id) === String(userOrGuestId);

    if (!isOwner && !isStaff(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

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
      lang,
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

    if (!agencyId) {
      return res
        .status(400)
        .json({ success: false, message: "Agency ID is required" });
    }

    const emergencies = await getEmergenciesByAgency(agencyId);
    const cleanData = localize(emergencies, lang, [
      "emergencyType",
      "category",
    ]);

    return res.status(200).json({ success: true, data: cleanData });
  } catch (error) {
    console.error("❌ Agency Handler Error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// =========================
// GET ALL EMERGENCIES ADMIN
// =========================
const getAllEmergenciesAdmin = async (req, res) => {
  try {
    const lang = getLang(req);
    const emergencies = await getAllEmergenciesForAdmin();
    const cleanData = localize(emergencies, lang, [
      "emergencyType",
      "category",
    ]);

    return res.json({ success: true, data: cleanData });
  } catch (err) {
    console.error("❌ Admin Handler Error:", err);
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

    const isOwner =
      req.user.type === "user" &&
      String(emergency.citizenId) === String(req.user.id);
    if (!isOwner && !isStaff(req.user)) {
      return res.status(403).json({ success: false, message: "Access denied" });
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
      .status(
        error.statusCode || (error.message.includes("not found") ? 404 : 500),
      )
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
