const {
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies, // Added this
} = require("../services/agencyService");

/**
 * Create Agency
 */
const createAgencyHandler = async (req, res) => {
  try {
    const {
      name,
      username,
      password,
      email,
      phone,
      location,
      agencyTypeId,
      status,
    } = req.body;

    if (!name || !username || !password || !agencyTypeId) {
      return res.status(400).json({
        success: false,
        message: "Name, username, password, and agencyTypeId are required",
      });
    }

    const agency = await createAgency({
      name,
      username,
      password,
      email,
      phone,
      location,
      agencyTypeId,
      status,
    });

    res.status(201).json({
      success: true,
      message: "Agency created successfully",
      data: agency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Update Agency
 */
const updateAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agency = await updateAgency(id, req.body);

    res.status(200).json({
      success: true,
      message: "Agency updated successfully",
      data: agency,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Delete Agency
 */
const deleteAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAgency(id);

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
 * Get All Agencies
 */
const getAllAgenciesHandler = async (req, res) => {
  try {
    const agencies = await getAllAgencies();
    res.status(200).json({
      success: true,
      data: agencies,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
  getAllAgenciesHandler, // Export the new handler
};
