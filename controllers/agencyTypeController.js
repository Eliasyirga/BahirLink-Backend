const {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
} = require("../services/AgencyTypeService");

/**
 * Create Agency Type
 */
const createAgencyTypeHandler = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name is required" });
    }

    const agencyType = await createAgencyType({ name, description });

    res.status(201).json({
      message: "Agency type created successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Update Agency Type
 */
const updateAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const agencyType = await updateAgencyType(id, req.body);

    res.status(200).json({
      message: "Agency type updated successfully",
      data: agencyType,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

/**
 * Delete Agency Type
 */
const deleteAgencyTypeHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAgencyType(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  createAgencyTypeHandler,
  updateAgencyTypeHandler,
  deleteAgencyTypeHandler,
};
