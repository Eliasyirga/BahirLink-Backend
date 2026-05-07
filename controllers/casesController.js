const casesService = require("../services/casesService");

/**
 * Handle new case deployment via multipart/form-data
 */
const createCase = async (req, res) => {
  try {
    const { fullName, caseTypeId, responderTeamId } = req.body;

    // Strict validation for required fields
    if (!fullName || !caseTypeId || !responderTeamId) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Case Type, and Responder Team are required.",
      });
    }

    /**
     * Parsing logic:
     * Localized fields (fullName, description, distinctiveFeatures) 
     * can come in as JSON strings if sent via FormData.
     */
    const parseLocalized = (field) => {
      try {
        return typeof field === 'string' ? JSON.parse(field) : field;
      } catch (e) {
        return field; // Return as is, Service layer will handle string-to-object conversion
      }
    };

    const caseData = {
      fullName:            parseLocalized(req.body.fullName),
      description:         parseLocalized(req.body.description),
      distinctiveFeatures: parseLocalized(req.body.distinctiveFeatures),
      gender:              req.body.gender || null,
      priority:            req.body.priority || "medium",
      lastSeenDate:        req.body.lastSeenDate || null,
      contactInfo:         req.body.contactInfo || null,
      isDangerous:         req.body.isDangerous === "true" || req.body.isDangerous === true,

      // Numeric fields
      age:                 req.body.age ? parseInt(req.body.age, 10) : null,
      height:              req.body.height ? parseInt(req.body.height, 10) : null,
      weight:              req.body.weight ? parseInt(req.body.weight, 10) : null,
      reward:              req.body.reward ? parseFloat(req.body.reward) : 0,
      
      caseTypeId:          parseInt(caseTypeId, 10),
      responderTeamId:     parseInt(responderTeamId, 10),
      lastSeenLocationId:  req.body.lastSeenLocationId ? parseInt(req.body.lastSeenLocationId, 10) : null,

      // Media attachment from Multer
      mediaUrl:            req.file ? `/uploads/${req.file.filename}` : null,
      mediaType:           req.file ? "photo" : null,
    };

    const newCase = await casesService.createCase(caseData);
    
    return res.status(201).json({
      success: true,
      message: "Case registered successfully",
      data: newCase
    });
  } catch (error) {
    console.error("❌ Controller Error [createCase]:", error);
    return res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to register case." 
    });
  }
};

/**
 * Retrieve all registered cases
 */
const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    console.error("❌ Controller Error [getAllCases]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Fetch granular case intelligence by ID
 */
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseData = await casesService.getCaseById(id);
    return res.status(200).json({
      success: true,
      data: caseData
    });
  } catch (error) {
    console.error("❌ Controller Error [getCaseById]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * Update case operational status or full data
 */
const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: "Status value is required." });
    }

    const result = await casesService.updateCaseStatus(id, status);
    return res.status(200).json({ 
      success: true, 
      message: "Status updated successfully", 
      data: result 
    });
  } catch (error) {
    console.error("❌ Controller Error [updateCaseStatus]:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Filter cases by tactical responder team
 */
const getCasesByResponderTeam = async (req, res) => {
  try {
    const { responderTeamId } = req.params;
    let cases;
    
    if (responderTeamId === "all") {
      cases = await casesService.getAllCases();
    } else {
      cases = await casesService.getCasesByResponderTeam(parseInt(responderTeamId, 10));
    }
    
    return res.status(200).json({
      success: true,
      count: cases.length,
      data: cases
    });
  } catch (error) {
    console.error("❌ Controller Error [getCasesByResponderTeam]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Terminate a case record
 */
const deleteCase = async (req, res) => {
  try {
    const result = await casesService.deleteCase(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Controller Error [deleteCase]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam,
  updateCaseStatus,
  deleteCase,
};