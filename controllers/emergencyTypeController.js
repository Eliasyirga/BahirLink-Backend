const emergencyTypeService = require("../services/emergencyTypeService");


const createEmergencyType = async (req, res) => {
  try {
    const emergencyType = await emergencyTypeService.createEmergencyType(req.body);
    res.status(201).json({ success: true, emergencyType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const deleteEmergencyType = async (req, res) => {
  try {
    const success = await emergencyTypeService.deleteEmergencyType(req.params.id);
    if (success) {
      res.json({ success: true, message: "EmergencyType deleted" });
    } else {
      res.status(404).json({ success: false, message: "EmergencyType not found" });
    }
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


const getAllEmergencyTypes = async (req, res) => {
  try {
    const emergencyTypes = await emergencyTypeService.getAllEmergencyTypes();
    res.json({ success: true, emergencyTypes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};