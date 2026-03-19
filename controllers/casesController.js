const casesService = require("../services/casesService");


const createCase = async (req, res) => {
  try {
    const newCase = await casesService.createCase(req.body);
    res.status(201).json(newCase);
  } catch (error) {
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

/**
 * Update case status (approve/reject)
 */
const updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body; // status = "approved" | "rejected" | "pending"
    const updatedCase = await casesService.updateCaseStatus(
      req.params.id,
      status,
    );
    res.status(200).json(updatedCase);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * Delete a case
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
  updateCaseStatus,
  deleteCase,
};
