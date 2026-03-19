const {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
  getAllAgencyTypes, // Import the new service
} = require("../services/AgencyTypeService");

/**
 * Create a new Agency Type
 */
const createAgencyTypeHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res
        .status(400)
        .json({ success: false, message: "Name is required" });
    }

    const agencyType = await createAgencyType({ name, description });

    res.status(201).json({
      success: true,
      message: "Agency type created successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update an existing Agency Type
 */
const updateAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agencyType = await updateAgencyType(id, req.body);

    res.status(200).json({
      success: true,
      message: "Agency type updated successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete an Agency Type
 */
const deleteAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAgencyType(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Get all Agency Types
 */
const getAllAgencyTypesHandler = async (req, res) => {
  try {
    const agencyTypes = await getAllAgencyTypes();
    res.status(200).json({
      success: true,
      data: agencyTypes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
  getAllAgencyTypesHandler,
};
