const serviceService = require("../services/serviceService");

/**
 * Reads the preferred language from:
 *  1. Accept-Language header  (Flutter client sends "am" or "en")
 *  2. ?lang= query param      (admin / web dashboards)
 *  3. Defaults to "en"
 */
const parseLang = (req) => {
  // Query param wins if explicitly set (admin panel use-case).
  if (req.query.lang && req.query.lang !== "en") return req.query.lang;

  const header = (req.headers["accept-language"] || "").split(/[,;]/)[0].trim().toLowerCase();
  if (header === "am" || header.startsWith("am-")) return "am";

  return req.query.lang || "en";
};

/**
 * ✅ CREATE SERVICE
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
      req.file,
    );

    return res.status(201).json({
      success: true,
      message: "Service created successfully",
      data: service,
    });
  } catch (err) {
    console.error("❌ Controller Error (Create):", err);
    return res.status(400).json({
      success: false,
      error: err.message || "Failed to create service",
    });
  }
};

/**
 * ✅ GET ALL SERVICES
 * Supports ?lang=en, ?lang=am, or ?lang=all
 */
exports.getAll = async (req, res) => {
  try {
    const lang = parseLang(req);
    const services = await serviceService.getAllServices(lang);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
    });
  } catch (err) {
    console.error("❌ Controller Error (GetAll):", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ✅ GET SERVICES BY USER
 * Flutter sends Accept-Language: am or Accept-Language: en
 */
exports.getByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const lang = parseLang(req);   // ← was: req.query.lang || "en"

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
    const lang = parseLang(req);

    const services = await serviceService.getServicesByType(
      serviceTypeId,
      lang,
    );

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services,
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
    const lang = parseLang(req);

    if (!agencyId || isNaN(parseInt(agencyId))) {
      return res
        .status(400)
        .json({ success: false, message: "Valid Agency ID is required" });
    }

    const services = await serviceService.getServicesByAgency(agencyId, lang);

    return res.status(200).json({
      success: true,
      count: services.length,
      data: services || [],
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
 */
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedService = await serviceService.updateService(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
      data: updatedService,
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
      message: "Service deleted successfully",
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
    const lang = parseLang(req);

    if (!responderTeamId) {
      return res.status(400).json({
        success: false,
        message: "Responder Team ID is required",
      });
    }

    const services = await serviceService.getServicesForResponderTeam(
      responderTeamId,
      lang,
    );

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