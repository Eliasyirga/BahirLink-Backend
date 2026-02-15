const emergencyService = require("../services/emergencyService");

const createUserEmergency = async (req, res) => {
  try {
    const mediaUrl = req.file ? req.file.path : null;
    const mediaType = req.body.mediaType || null;

    const userId = parseInt(req.params.userId, 10);

    const result = await emergencyService.createUserEmergency(userId,
      {
        ...req.body,
        mediaUrl,
        mediaType,
      },
    );

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const createGuestEmergency = async (req, res) => {
  try {
    console.log("Request body:", req.body);

    const mediaUrl = req.file ? req.file.path : null;
    const mediaType = req.body.mediaType || null;

    const result = await emergencyService.createGuestEmergency({
      ...req.body,
      mediaUrl,
      mediaType,
    });

    res.status(201).json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

const updateEmergency = async (req, res) => {
  try {
    const { isGuest } = req.query;

    const mediaUrl = req.file ? req.file.path : req.body.mediaUrl || null;
    const mediaType = req.body.mediaType || null;

    const result = await emergencyService.updateEmergency(
      req.params.userOrGuestId,
      req.params.id,
      { ...req.body, mediaUrl, mediaType },
      isGuest === "true",
    );

    res.json({ success: true, data: result });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

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
