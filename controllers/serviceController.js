const serviceService = require("../services/serviceService");

// ✅ CREATE SERVICE
exports.create = async (req, res) => {
  try {
    const { userId } = req.params;

    // Log for debugging file uploads
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
      service 
    });
  } catch (err) {
    console.error("❌ Controller Error (Create):", err);
    return res.status(400).json({ 
      success: false, 
      error: err.message || "Failed to create service" 
    });
  }
};

// ✅ GET ALL SERVICES
exports.getAll = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    return res.status(200).json({ 
      success: true, 
      count: services.length,
      services 
    });
  } catch (err) {
    console.error("❌ Controller Error (GetAll):", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ✅ GET SERVICES BY USER (citizenId)
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;

    // Validation: Ensure userId exists and is a number
    if (!userId || isNaN(parseInt(userId))) {
      return res.status(400).json({
        success: false,
        error: "A valid numeric User ID is required.",
      });
    }

    console.log(`📡 Fetching services for User ID: ${userId}...`);
    const services = await serviceService.getServicesByUser(userId);

    return res.status(200).json({
      success: true,
      count: services.length,
      services: services || [],
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

// ✅ UPDATE SERVICE
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Note: If updating JSONB fields (name/description), req.body should 
    // ideally contain the language object { en: "...", am: "..." }
    const service = await serviceService.updateService(id, req.body);
    
    return res.status(200).json({ 
      success: true, 
      message: "Service updated successfully",
      service 
    });
  } catch (err) {
    console.error("❌ Controller Error (Update):", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET SERVICES BY SERVICE TYPE
exports.getByServiceType = async (req, res) => {
  try {
    const { serviceTypeId } = req.params;
    const services = await serviceService.getServicesByType(serviceTypeId);
    
    return res.status(200).json({ 
      success: true, 
      count: services.length,
      services 
    });
  } catch (err) {
    console.error("❌ Controller Error (GetByType):", err);
    return res.status(400).json({ success: false, error: err.message });
  }
};

// ✅ GET SERVICES BY AGENCY
exports.getServicesByAgency = async (req, res) => {
  try {
    const { agencyId } = req.params;

    if (!agencyId || isNaN(parseInt(agencyId))) {
      return res.status(400).json({ success: false, message: "Valid Agency ID is required" });
    }

    const services = await serviceService.getServicesByAgency(agencyId);

    // Standardized response format
    return res.status(200).json({
      success: true,
      count: services.length,
      services: services || []
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

// ✅ DELETE SERVICE
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
<<<<<<< HEAD
};
=======
};

exports.getResponderTeamServices = async (req, res) => {
  try {
    // The ID comes from the URL parameter (req.params.id)
    // which was decoded in your React frontend as decoded.id
    const responderTeamId = req.params.id;

    if (!responderTeamId) {
      return res.status(400).json({
        success: false,
        message: "Responder Team ID is required",
      });
    }

    const services =
      await serviceService.getServicesForResponderTeam(responderTeamId);

    // If no services found, return an empty array with 200 (not an error)
    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (error) {
    console.error("Controller Error [getResponderTeamServices]:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch team services",
      error: error.message,
    });
  }
};
>>>>>>> 5ab60b1ff1a1898185d2cd50800fba0222c014e1
