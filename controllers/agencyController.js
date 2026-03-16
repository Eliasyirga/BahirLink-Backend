const { createAgency, updateAgency, deleteAgency } = require("../services/agencyService");

/**
 * Create Agency
 */
const createAgencyHandler = async (req, res) => {
  try {
    const { name, username, password, email, phone, location, agencyTypeId, status } = req.body;

    if (!name || !username || !password || !agencyTypeId) {
      return res.status(400).json({ message: "Name, username, password, and agencyTypeId are required" });
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
      message: "Agency created successfully",
      data: agency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      message: "Agency updated successfully",
      data: agency,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Agency
 */
const deleteAgencyHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteAgency(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createAgencyHandler,
  updateAgencyHandler,
  deleteAgencyHandler,
};