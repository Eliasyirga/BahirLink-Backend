const AgencyType = require("../models/AgencyType");

/**
 * Create a new Agency Type
 * @param {Object} data - { name, description }
 * @param {number} creatorId - ID of the user creating this
 */
const createAgencyType = async (data, creatorId) => {
  const { name, description } = data;

  // Logic: Map the creatorId from the controller/middleware to the database field
  const agencyType = await AgencyType.create({
    name,
    description,
    creatorId,
  });

  return agencyType;
};

/**
 * Update an existing Agency Type
 * @param {number|string} id - Agency type ID
 * @param {Object} data - Fields to update
 * @param {number} creatorId - ID of the user (for ownership verification)
 */
const updateAgencyType = async (id, data, creatorId) => {
  // Logic: Ensure the person updating is the one who created it
  const agencyType = await AgencyType.findOne({
    where: { id, creatorId },
  });

  if (!agencyType) {
    throw new Error("Agency type not found or unauthorized");
  }

  await agencyType.update(data);
  return agencyType;
};

/**
 * Delete an Agency Type
 */
const deleteAgencyType = async (id, creatorId) => {
  // Logic: Ensure the person deleting is the owner
  const agencyType = await AgencyType.findOne({
    where: { id, creatorId },
  });

  if (!agencyType) {
    throw new Error("Agency type not found or unauthorized");
  }

  await agencyType.destroy();
  return { message: "Agency type deleted successfully" };
};

/**
 * Get all Agency Types (Global list)
 */
const getAllAgencyTypes = async () => {
  const agencyTypes = await AgencyType.findAll({
    order: [["name", "ASC"]],
  });
  return agencyTypes;
};

/**
 * ✅ GET BY CREATOR ID
 * Logic: Fetch only the types created by a specific user
 */
const getAgencyTypesByCreator = async (creatorId) => {
  if (!creatorId) throw new Error("Creator ID is required");

  return await AgencyType.findAll({
    where: { creatorId },
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createAgencyType,
  updateAgencyType,
  deleteAgencyType,
  getAllAgencyTypes,
  getAgencyTypesByCreator, // Added for your /my-agents route
};
