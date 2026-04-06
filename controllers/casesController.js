const casesService = require("../services/casesService");

// ✅ CREATE CASE
const createCase = async (req, res) => {
  try {
    const newCase = await casesService.createCase(req.body);
    res.status(201).json(newCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// ✅ GET ALL CASES
const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ GET CASE BY ID
const getCaseById = async (req, res) => {
  try {
    const singleCase = await casesService.getCaseById(req.params.id);
    res.status(200).json(singleCase);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

// ✅ GET CASES BY RESPONDER TEAM
const getCasesByResponderTeam = async (req, res) => {
  try {
    const responderTeamId = req.params.responderTeamId;
    const cases = await casesService.getCasesByResponderTeam(responderTeamId);
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ UPDATE CASE STATUS
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

// ✅ DELETE CASE
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
  getCasesByResponderTeam, // ✅ new
  updateCaseStatus,
  deleteCase,
};
