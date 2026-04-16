// controllers/serviceController.js
const serviceService = require("../services/serviceService");

// ✅ CREATE SERVICE
exports.create = async (req, res) => {
  try {
    // We pass req.body AND the userId from the URL params
    const service = await serviceService.createService(
      req.body,
      req.params.userId,
    );

    res.status(201).json({
      success: true,
      service,
    });
  } catch (err) {
    console.error("Error in Service Controller:", err);
    res.status(400).json({
      success: false,
      error: err.message,
    });
  }
};
// ✅ UPDATE SERVICE
exports.update = async (req, res) => {
  try {
    const service = await serviceService.updateService(req.params.id, req.body);
    res.json({ success: true, service });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET ALL SERVICES
exports.getAll = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.json({ success: true, services });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET SERVICES BY SERVICE TYPE
exports.getByServiceType = async (req, res) => {
  try {
    const services = await serviceService.getServicesByType(
      req.params.serviceTypeId,
    );
    res.json({ success: true, services });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET SERVICES BY USER (citizenId)
exports.getByUser = async (req, res) => {
  try {
    const services = await serviceService.getServicesByUser(req.params.userId);
    res.json({ success: true, services });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ DELETE SERVICE
exports.delete = async (req, res) => {
  try {
    await serviceService.deleteService(req.params.id);
    res.json({ success: true, message: "Service deleted successfully" });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
