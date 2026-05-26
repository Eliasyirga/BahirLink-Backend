const {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
  getAllAgencyTypes,
  getAgencyTypesByCreator,
} = require("../services/AgencyTypeService");

const createAgencyTypeHandler = async (req, res) => {
  try {
    // Guard: ensure auth middleware ran
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, description } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: "Name is required" });
    }

    const agencyType = await createAgencyType({ name, description }, req.user.id);
    res.status(201).json({
      success: true,
      message: "Agency type created successfully",
      data: agencyType,
    });
  } catch (error) {
    // 409 for duplicates, 500 for everything else
    const status = error.message.includes("already exists") ? 409 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const updateAgencyTypeHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const agencyType = await updateAgencyType(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, message: "Agency type updated successfully", data: agencyType });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const deleteAgencyTypeHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const result = await deleteAgencyType(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    const status = error.message.includes("not found") ? 404 : 500;
    res.status(status).json({ success: false, message: error.message });
  }
};

const getAllAgencyTypesHandler = async (req, res) => {
  try {
    const agencyTypes = await getAllAgencyTypes();
    res.status(200).json({ success: true, data: agencyTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getAgentsByCreatorIdHandler = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const agencyTypes = await getAgencyTypesByCreator(req.user.id);
    res.status(200).json({ success: true, data: agencyTypes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
  getAllAgencyTypesHandler,
  getAgentsByCreatorIdHandler,
};