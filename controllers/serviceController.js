const serviceService = require("../services/serviceService");

/**
 * ✅ CREATE SERVICE
 * Handles file uploads and initial data creation.
 */
exports.create = async (req, res) => {
  try {
    const { userId } = req.params;

    if (req.file) {
      console.log(`📂 Upload received: ${req.file.filename}`);
    }

    const service = await serviceService.createService(
      req.body,
      userId,
      req.file
    );

    return res.status(201).json({ 
      success: true, 
      message: "Service created successfully",
      data: service 
    });
  } catch (err) {
    console.error("❌ Controller Error (Create):", err);
    return res.status(400).json({ 
      success: false, 
      error: err.message || "Failed to create service" 
    });
  }
};

/**
 * ✅ GET ALL SERVICES
 * Supports ?lang=en, ?lang=am, or ?lang=all
 */
exports.getAll = async (req, res) => {
  try {
    const lang = req.query.lang || "en";
    const services = await serviceService.getAllServices(lang);

    return res.status(200).json({ 
      success: true, 
      count: services.length,
      data: services 
    });
  } catch (err) {
    console.error("❌ Controller Error (GetAll):", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET SERVICES BY USER
 */
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const lang = req.query.lang || "en";

    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        error: "A valid numeric User ID is required.",
      });
    }

    const services = await serviceService.getServicesByUser(userId, lang);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services || [],
    });
  } catch (err) {
    console.error("❌ Controller Error (GetByUser):", err.message);
    return res.status(500).json({
      success: false,
      error: "Internal Server Error",
      message: err.message,
    });
  }
};

/**
 * ✅ GET BY SERVICE TYPE
 */
exports.getByServiceType = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;
    const lang = req.query.lang || "en";
    
    const services = await serviceService.getServicesByType(serviceTypeId, lang);
    
    return res.status(200).json({ 
      success: true, 
      count: services.length,
      data: services 
    });
  } catch (err) {
    console.error("❌ Controller Error (GetByType):", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET BY AGENCY
 */
exports.getServicesByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const lang = req.query.lang || "en";

    if (!agencyId || isNaN(parseInt(agencyId))) {
      return res.status(400).json({ success: false, message: "Valid Agency ID is required" });
    }

    const services = await serviceService.getServicesByAgency(agencyId, lang);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services || []
    });
  } catch (error) {
    console.error("❌ Controller Error (GetByAgency):", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch services for this agency",
      error: error.message,
    });
  }
};

/**
 * ✅ UPDATE SERVICE
 * Handles deep merging of JSONB fields (name/description)
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await serviceService.updateService(id, req.body);
    
    return res.status(200).json({ 
      success: true, 
      message: "Service updated successfully",
      data: updatedService 
    });
  } catch (err) {
    console.error("❌ Controller Error (Update):", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * ✅ DELETE SERVICE
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    await serviceService.deleteService(id);
    return res.status(200).json({ 
      success: true, 
      message: "Service deleted successfully" 
    });
  } catch (err) {
    console.error("❌ Controller Error (Delete):", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET FOR RESPONDER TEAM
 */
exports.getResponderTeamServices = async (req, res) => {
  try {
    const responderTeamId = req.params.id;
    const lang = req.query.lang || "en";

    if (!responderTeamId) {
      return res.status(400).json({
        success: false,
        message: "Responder Team ID is required",
      });
    }

    const services = await serviceService.getServicesForResponderTeam(responderTeamId, lang);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services || [],
    });
  } catch (error) {
    console.error("❌ Controller Error (getResponderTeamServices):", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team services",
      error: error.message,
    });
  }
};