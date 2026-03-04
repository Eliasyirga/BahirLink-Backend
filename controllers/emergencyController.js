const emergencyService = require("../services/emergencyService");

// Create guest emergency
const createGuestEmergency = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const result = await emergencyService.createGuestEmergency(
      req.body,
      req.file,
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Create user emergency
const createUserEmergency = async (req, res) => {
  try {
    const userId = parseInt(req.params.userId, 10);
    const result = await emergencyService.createUserEmergency(
      userId,
      req.body,
      req.file,
    );
    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Update emergency
const updateEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const result = await emergencyService.updateEmergency(
      req.params.userOrGuestId,
      req.params.id,
      req.body,
      req.file,
      isGuest === "true",
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Delete emergency
const deleteEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const result = await emergencyService.deleteEmergency(
      req.params.userOrGuestId,
      req.params.id,
      isGuest === "true",
    );
    res.json({ success: true, message: result.message });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get emergencies
const getEmergencies = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const result = await emergencyService.getEmergencies(
      req.params.userOrGuestId,
      isGuest === "true",
    );
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

module.exports = {
  createUserEmergency,
  createGuestEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
};
