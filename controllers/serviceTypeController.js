const service = require("../services/serviceTypeService");

// CREATE SERVICE TYPE
const createServiceType = async (req, res) => {
  try {
    const data = await service.createServiceType(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET ALL SERVICE TYPES
const getAllServiceTypes = async (req, res) => {
  try {
    const data = await service.getAllServiceTypes();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET SERVICE TYPE BY ID
const getServiceTypeById = async (req, res) => {
  try {
    const data = await service.getServiceTypeById(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

// UPDATE SERVICE TYPE
const updateServiceType = async (req, res) => {
  try {
    const data = await service.updateServiceType(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// DELETE SERVICE TYPE
const deleteServiceType = async (req, res) => {
  try {
    const data = await service.deleteServiceType(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

module.exports = {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};
