// controllers/emergencyController.js
const emergencyService = require("../services/emergencyService");
const { Emergency, EmergencyType } = require("../models"); // <-- IMPORT MODELS

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergency = async (req, res) => {
  try {
    console.log("Create Guest Emergency - Request body:", req.body);

    const result = await emergencyService.createGuestEmergency(
      req.body,
      req.file,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("Error creating guest emergency:", err);
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

    const result = await emergencyService.createUserEmergency(
      userId,
      req.body,
      req.file,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    console.error("Error creating user emergency:", err);
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

    const result = await emergencyService.updateEmergency(
      userOrGuestId,
      req.params.id,
      req.body,
      req.file,
      isGuest === "true",
    );

    res.json({ success: true, data: result });
  } catch (err) {
    console.error("Error updating emergency:", err);
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

    console.log(
      `Delete Emergency - ID: ${req.params.id}, User/Guest ID: ${userOrGuestId}, isGuest: ${isGuest}`,
    );

    const result = await emergencyService.deleteEmergency(
      userOrGuestId,
      req.params.id,
      isGuest === "true",
    );

    res.json({ success: true, message: result.message });
  } catch (err) {
    console.error("Error deleting emergency:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// GET EMERGENCIES FOR USER/GUEST
// =========================
const getEmergencies = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const userOrGuestId = parseInt(req.params.userOrGuestId, 10);

    if (isNaN(userOrGuestId)) throw new Error("Invalid user/guest ID");

    console.log(
      `Get Emergencies - User/Guest ID: ${userOrGuestId}, isGuest: ${isGuest}`,
    );

    const result = await emergencyService.getEmergencies(
      userOrGuestId,
      isGuest === "true",
    );

    res.json({ success: true, data: Array.isArray(result) ? result : [] });
  } catch (err) {
    console.error("Error fetching emergencies:", err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;

    const emergencies =
      await emergencyService.getEmergenciesForAgency(agencyId);

    res.json({ success: true, data: emergencies });
  } catch (err) {
    console.error("Error fetching emergencies:", err);
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
