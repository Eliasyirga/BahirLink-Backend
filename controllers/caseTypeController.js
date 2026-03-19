const caseTypeService = require("../services/caseTypeService");

const create = async (req, res) => {
  try {
    const caseType = await caseTypeService.createCaseType(req.body);
    res.status(201).json(caseType);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const getAll = async (req, res) => {
  try {
    const caseTypes = await caseTypeService.getAllCaseTypes();
    res.status(200).json(caseTypes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getOne = async (req, res) => {
  try {
    const caseType = await caseTypeService.getCaseTypeById(req.params.id);
    res.status(200).json(caseType);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const updated = await caseTypeService.updateCaseType(
      req.params.id,
      req.body,
    );
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

const remove = async (req, res) => {
  try {
    const result = await caseTypeService.deleteCaseType(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  create,
  getAll,
  getOne,
  update,
  remove,
};
