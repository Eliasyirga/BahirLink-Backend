const casesService = require("../services/casesService");
const { Cases, CaseType, Kebele, CaseReport } = require("../models");

/**
 * Handle new case deployment via multipart/form-data
 */
const createCase = async (req, res) => {
  try {
    const {
      fullName,
      caseTypeId,
      responderTeamId,
      height,
      weight,
      age,
      reward,
    } = req.body;

    // 1. Critical Validation
    if (!fullName || !caseTypeId || !responderTeamId) {
      return res.status(400).json({
        message:
          "Deployment failed: Full Name, Case Type, and Responder Team are required.",
      });
    }

    // 2. Data Preparation & Strict Casting
    const caseData = {
      ...req.body,
      // Ensure numeric fields are numbers or null (not empty strings)
      height: height && height !== "" ? parseFloat(height) : null,
      weight: weight && weight !== "" ? parseFloat(weight) : null,
      age: age && age !== "" ? parseInt(age, 10) : null,
      reward: reward && reward !== "" ? parseFloat(reward) : 0,

      // Ensure IDs are integers
      caseTypeId: parseInt(caseTypeId, 10),
      responderTeamId: parseInt(responderTeamId, 10),
      lastSeenLocationId: req.body.lastSeenLocationId
        ? parseInt(req.body.lastSeenLocationId, 10)
        : null,

      // Media Handling
      mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
      mediaType: req.file ? "photo" : null,
    };

    const newCase = await casesService.createCase(caseData);
    res.status(201).json(newCase);
  } catch (error) {
    console.error("Controller Error [createCase]:", error);
    res
      .status(400)
      .json({ message: error.message || "Failed to register case." });
  }
};

/**
 * Retrieve all registered cases
 */
const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    res.status(200).json(cases);
  } catch (error) {
    console.error("Controller Error [getAllCases]:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Fetch granular case intelligence
 */
const getCaseById = async (req, res) => {
  try {
    const { id } = req.params;
    const caseData = await casesService.getCaseById(id);
    res.status(200).json(caseData);
  } catch (error) {
    console.error("Controller Error [getCaseById]:", error);
    res.status(404).json({ message: error.message });
  }
};

/**
 * Update case operational status
 */
const updateCaseStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status)
      return res.status(400).json({ message: "Status value is required." });

    const result = await casesService.updateCaseStatus(id, status);
    res.json({ message: "Status updated successfully", data: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
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
      cases = await casesService.getCasesByResponderTeam(
        parseInt(responderTeamId, 10),
      );
    }
    res.status(200).json(cases);
  } catch (error) {
    console.error("Controller Error [getCasesByResponderTeam]:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Terminate a case record
 */
const deleteCase = async (req, res) => {
  try {
    const result = await casesService.deleteCase(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
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
