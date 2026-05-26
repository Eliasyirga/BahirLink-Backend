const AgencyType = require("../models/AgencyType");
const { Op } = require("sequelize");

const createAgencyType = async (data, creatorId) => {
  const { name, description } = data;

  if (!name || (typeof name === "string" && !name.trim())) {
    throw new Error("Name is required");
  }

  // Duplicate check: same name + same creator
  const existing = await AgencyType.findOne({
    where: {
      creatorId,
      // handles both plain string and JSON-stored name
      name: typeof name === "object" ? name : name.trim(),
    },
  });
  if (existing) throw new Error("Agency type with this name already exists");

  return await AgencyType.create({
    name: typeof name === "string" ? name.trim() : name,
    description: description || null,
    creatorId,
  });
};

const updateAgencyType = async (id, data, creatorId) => {
  const agencyType = await AgencyType.findOne({ where: { id, creatorId } });
  if (!agencyType) throw new Error("Agency type not found or unauthorized");

  await agencyType.update(data);
  return agencyType;
};

const deleteAgencyType = async (id, creatorId) => {
  const agencyType = await AgencyType.findOne({ where: { id, creatorId } });
  if (!agencyType) throw new Error("Agency type not found or unauthorized");

  await agencyType.destroy();
  return { message: "Agency type deleted successfully" };
};

const getAllAgencyTypes = async () => {
  return await AgencyType.findAll({ order: [["name", "ASC"]] });
};

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
  getAgencyTypesByCreator,
};