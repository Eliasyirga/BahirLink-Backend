const casesService = require("../services/casesService");

const createCase = async (req, res) => {
  try {
    // 1. Manually build the data object from req.body
    // This ensures strings from FormData are converted to Numbers for Sequelize
    const data = {
      fullName: req.body.fullName,
      description: req.body.description,
      gender: req.body.gender,
      age: req.body.age ? parseInt(req.body.age) : null,

      // Convert these strings to actual Integers
      caseTypeId: parseInt(req.body.caseTypeId),
      lastSeenLocationId: req.body.lastSeenLocationId
        ? parseInt(req.body.lastSeenLocationId)
        : null,
      agencyId: parseInt(req.body.agencyId || 1),
      responderTeamId: parseInt(req.body.responderTeamId || 1),

      // 2. Capture the file path saved by Multer
      mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
      mediaType: req.file ? "photo" : null,
      contactInfo: req.body.contactInfo || null,
    };

    // 3. Pass the CLEANED data object to your service
    const newCase = await casesService.createCase(data);

    res.status(201).json(newCase);
  } catch (error) {
    console.error("Controller Error:", error);
    res.status(400).json({ message: error.message });
  }
};

const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCaseById = async (req, res) => {
  try {
    const singleCase = await casesService.getCaseById(req.params.id);
    res.status(200).json(singleCase);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const getCasesByResponderTeam = async (req, res) => {
  try {
    const responderTeamId = req.params.responderTeamId;

    let cases;
    // Check if the frontend is requesting EVERYTHING
    if (responderTeamId === "all") {
      cases = await casesService.getAllCases();
    } else {
      // Otherwise, treat it as a number for a specific team
      cases = await casesService.getCasesByResponderTeam(
        parseInt(responderTeamId),
      );
    }

    res.status(200).json(cases);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body; // "approved" | "rejected" | "pending"
    const updatedCase = await casesService.updateCaseStatus(
      req.params.id,
      status,
    );
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

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
