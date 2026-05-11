const {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
  getAllAgencyTypes,
  getAgencyTypesByCreator, // Import the new filter service
} = require("../services/AgencyTypeService");

/**
 * ✅ CREATE
 */
const createAgencyTypeHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    // Pass req.user.id as the creatorId
    const agencyType = await createAgencyType(
      { name, description },
      req.user.id,
    );

    res.status(201).json({
      success: true,
      message: "Agency type created successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ UPDATE
 */
const updateAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Pass req.user.id to ensure only the owner can update
    const agencyType = await updateAgencyType(id, req.body, req.user.id);

    res.status(200).json({
      success: true,
      message: "Agency type updated successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ DELETE
 */
const deleteAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Pass req.user.id to ensure only the owner can delete
    const result = await deleteAgencyType(id, req.user.id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ GET ALL (Global)
 */
const getAllAgencyTypesHandler = async (req, res) => {
  try {
    const agencyTypes = await getAllAgencyTypes();
    res.status(200).json({
      success: true,
      data: agencyTypes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * ✅ GET BY CREATOR (Your "my-agents" logic)
 */
const getAgentsByCreatorIdHandler = async (req, res) => {
  try {
    // Filter by the logged-in user's ID
    const agencyTypes = await getAgencyTypesByCreator(req.user.id);
    res.status(200).json({
      success: true,
      data: agencyTypes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
  getAllAgencyTypesHandler,
  getAgentsByCreatorIdHandler, // Export this for your route
};
