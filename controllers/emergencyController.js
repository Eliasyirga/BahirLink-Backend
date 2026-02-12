const emergencyService = require("../services/emergencyService");


const createUserEmergency = async (req, res) => {
  try {
    const result = await emergencyService.createUserEmergency(req.params.userId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const createGuestEmergency = async (req, res) => {
  try {
    console.log("Request body:", req.body);
    // Remove guestId dependency — we create the Guest automatically
    const result = await emergencyService.createGuestEmergency(req.body);

    // Return success response with emergency + guestId
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};


const updateEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query; 
    const result = await emergencyService.updateEmergency(
      req.params.userOrGuestId,
      req.params.id,
      req.body,
      isGuest === "true"
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const result = await emergencyService.deleteEmergency(
      req.params.userOrGuestId,
      req.params.id,
      isGuest === "true"
    );
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const getEmergencies = async (req, res) => {
  try {
    const { isGuest } = req.query;
    const result = await emergencyService.getEmergencies(req.params.userOrGuestId, isGuest === "true");
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createUserEmergency,
  createGuestEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
};
