const service = require("../services/serviceTypeService");

/**
 * ✅ CREATE SERVICE TYPE
 */
const createServiceType = async (req, res) => {
  try {
    const data = await service.createServiceType(req.body);
    return res.status(201).json({
      success: true,
      message: "Service Type created successfully",
      data: data
    });
  } catch (err) {
    console.error("❌ Controller Error (ServiceType Create):", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET ALL SERVICE TYPES
 * Supports: ?lang=en, ?lang=am, or ?lang=all
 */
const getAllServiceTypes = async (req, res) => {
  try {
    // Extract language from query, default to 'en' for the mobile app
    const lang = req.query.lang || "en";
    
    const data = await service.getAllServiceTypes(lang);
    
    return res.status(200).json({
      success: true,
      count: data.length,
      data: data
    });
  } catch (err) {
    console.error("❌ Controller Error (ServiceType GetAll):", err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET SERVICE TYPE BY ID
 */
const getServiceTypeById = async (req, res) => {
  try {
    const lang = req.query.lang || "all"; 
    const data = await service.getServiceTypeById(req.params.id, lang);
    
    return res.status(200).json({
      success: true,
      data: data
    });
  } catch (err) {
    console.error("❌ Controller Error (ServiceType GetById):", err.message);
    return res.status(404).json({ success: false, error: err.message });
  }
};

/**
 * ✅ UPDATE SERVICE TYPE
 */
const updateServiceType = async (req, res) => {
  try {
    const data = await service.updateServiceType(req.params.id, req.body);
    return res.status(200).json({
      success: true,
      message: "Service Type updated successfully",
      data: data
    });
  } catch (err) {
    console.error("❌ Controller Error (ServiceType Update):", err.message);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * ✅ DELETE SERVICE TYPE
 */
const deleteServiceType = async (req, res) => {
  try {
    const result = await service.deleteServiceType(req.params.id);
    return res.status(200).json({
      success: true,
      message: result.message || "Service Type deleted successfully"
    });
  } catch (err) {
    console.error("❌ Controller Error (ServiceType Delete):", err.message);
    return res.status(404).json({ success: false, error: err.message });
  }
};

module.exports = {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};