const AgencyType = require("../models/AgencyType");

/**
 * Create a new Agency Type
 * @param {Object} data - { name, description }
 * @returns {Promise<Object>} Created agency type
 */
const createAgencyType = async (data) => {
  const { name, description } = data;

  const agencyType = await AgencyType.create({
    name,
    description,
  });

  return agencyType;
};

/**
 * Update an existing Agency Type
 * @param {number|string} id - Agency type ID
 * @param {Object} data - Fields to update
 * @returns {Promise<Object>} Updated agency type
 * @throws {Error} If agency type not found
 */
const updateAgencyType = async (id, data) => {
  const agencyType = await AgencyType.findByPk(id);

  if (!agencyType) {
    throw new Error("Agency type not found");
  }

  await agencyType.update(data);

  return agencyType;
};

/**
 * Delete an Agency Type
 * @param {number|string} id - Agency type ID
 * @returns {Promise<Object>} Success message
 * @throws {Error} If agency type not found
 */
const deleteAgencyType = async (id) => {
  const agencyType = await AgencyType.findByPk(id);

  if (!agencyType) {
    throw new Error("Agency type not found");
  }

  await agencyType.destroy();

  return { message: "Agency type deleted successfully" };
};

/**
 * Get all Agency Types
 * @returns {Promise<Array>} List of agency types
 */
const getAllAgencyTypes = async () => {
  const agencyTypes = await AgencyType.findAll({
    order: [["name", "ASC"]], // optional: sort alphabetically
  });
  return agencyTypes;
};

module.exports = {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
  getAllAgencyTypes, // Export for use in controller
};
