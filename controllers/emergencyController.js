// controllers/emergencyController.js
const emergencyService = require("../services/emergencyService");
const { Emergency, EmergencyType } = require("../models");

// =========================
// 🧠 HELPER: Normalize Location
// =========================
const normalizeLocation = (body) => {
  let latitude = body.latitude;
  let longitude = body.longitude;

  try {
    // Case 1: JSON string
    if (
      body.location &&
      typeof body.location === "string" &&
      body.location.startsWith("{")
    ) {
      const parsed = JSON.parse(body.location);
      latitude = parsed.latitude;
      longitude = parsed.longitude;
    }

    // Case 2: "lat,lng"
    else if (
      body.location &&
      typeof body.location === "string" &&
      body.location.includes(",")
    ) {
      const parts = body.location.split(",");
      latitude = parts[0];
      longitude = parts[1];
    }
  } catch (e) {
    console.warn("⚠️ Failed to parse location:", body.location);
  }

  return {
    ...body,
    latitude: latitude ? parseFloat(latitude) : null,
    longitude: longitude ? parseFloat(longitude) : null,
  };
};

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergency = async (req, res) => {
  try {
    console.log("Create Guest Emergency - Raw body:", req.body);

    // ✅ Normalize location
    const cleanBody = normalizeLocation(req.body);

    console.log("✅ Cleaned body:", cleanBody);

    const result = await emergencyService.createGuestEmergency(
      cleanBody,
      req.file,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error creating guest emergency:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// CREATE USER EMERGENCY
// =========================
const createUserEmergency = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    if (isNaN(userId)) throw new Error("Invalid user ID");

    console.log(`Create User Emergency - User ID: ${userId}`, req.body);

    // ✅ Normalize location (SAME as guest)
    const cleanBody = normalizeLocation(req.body);

    console.log("✅ Cleaned body:", cleanBody);

    const result = await emergencyService.createUserEmergency(
      userId,
      cleanBody,
      req.file,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error creating user emergency:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// UPDATE EMERGENCY
// =========================
const updateEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const userOrGuestId = parseInt(req.params.userOrGuestId, 10);

    if (isNaN(userOrGuestId)) throw new Error("Invalid user/guest ID");

    console.log(
      `Update Emergency - ID: ${req.params.id}, User/Guest ID: ${userOrGuestId}, isGuest: ${isGuest}`,
    );

    // ✅ Normalize location on update too
    const cleanBody = normalizeLocation(req.body);

    const result = await emergencyService.updateEmergency(
      userOrGuestId,
      req.params.id,
      cleanBody,
      req.file,
      isGuest === "true",
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("❌ Error updating emergency:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// DELETE EMERGENCY
// =========================
const deleteEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const userOrGuestId = parseInt(req.params.userOrGuestId, 10);

    if (isNaN(userOrGuestId)) throw new Error("Invalid user/guest ID");

    const result = await emergencyService.deleteEmergency(
      userOrGuestId,
      req.params.id,
      isGuest === "true",
    );

    res.json({ success: true, message: result.message });
  } catch (err) {
    console.error("❌ Error deleting emergency:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// GET EMERGENCIES
// =========================
const getEmergencies = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const userOrGuestId = parseInt(req.params.userOrGuestId, 10);

    if (isNaN(userOrGuestId)) throw new Error("Invalid user/guest ID");

    const result = await emergencyService.getEmergencies(
      userOrGuestId,
      isGuest === "true",
    );

    res.json({ success: true, data: Array.isArray(result) ? result : [] });
  } catch (err) {
    console.error("❌ Error fetching emergencies:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// GET BY AGENCY
// =========================
const getEmergenciesByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;

    const emergencies =
      await emergencyService.getEmergenciesForAgency(agencyId);

    res.json({ success: true, data: emergencies });
  } catch (err) {
    console.error("❌ Error fetching emergencies:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergenciesByAgency,
};
