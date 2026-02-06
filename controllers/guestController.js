const guestService = require("../services/guestService");


const createGuestController = async (req, res) => {
  const { contactNo } = req.body;

  if (!contactNo) {
    return res.status(400).json({ success: false, message: "contactNo is required" });
  }

  try {
    const guest = await guestService.createGuest(contactNo);
    res.status(201).json({ success: true, guest });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Create emergency
const createEmergency = async (req, res) => {
  try {
    const result = await guestService.createEmergency(req.params.guestId, req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update emergency
const updateEmergency = async (req, res) => {
  try {
    const result = await guestService.updateEmergency(req.params.guestId, req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Delete emergency
const deleteEmergency = async (req, res) => {
  try {
    const result = await guestService.deleteEmergency(req.params.guestId, req.params.id);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Get all emergencies
const getEmergencies = async (req, res) => {
  try {
    const result = await guestService.getEmergencies(req.params.guestId);
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

module.exports = {
  createEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  createGuestController
};
