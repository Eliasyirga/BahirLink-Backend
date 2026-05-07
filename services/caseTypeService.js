const CaseType = require("../models/CaseType");
const { sequelize } = require("../config/db");

// ✅ CREATE CASE TYPE
const createCaseType = async (data) => {
  const { name } = data;

  // Extract English name for the uniqueness check
  const englishName = typeof name === 'object' ? name.en : name;

  // Check uniqueness against the 'en' key in the JSONB column
  const existing = await CaseType.findOne({ 
    where: sequelize.json("name.en", englishName) 
  });
  
  if (existing) {
    throw new Error("Case type with this English name already exists");
  }

  // Ensure we store it as an object
  const formattedName = typeof name === 'string' 
    ? { en: name, am: "" } 
    : name;

  return await CaseType.create({ name: formattedName });
};

// ✅ GET ALL CASE TYPES
const getAllCaseTypes = async () => {
  return await CaseType.findAll({
    attributes: ["id", "name"],
    // Order by English name inside the JSONB object
    order: [[sequelize.json("name.en"), "ASC"]],
  });
};

// ✅ GET CASE TYPE BY ID
const getCaseTypeById = async (id) => {
  const caseType = await CaseType.findByPk(id);

  if (!caseType) {
    throw new Error("Case type not found");
  }

  return caseType;
};

// ✅ UPDATE CASE TYPE
const updateCaseType = async (id, data) => {
  const caseType = await CaseType.findByPk(id);

  if (!caseType) {
    throw new Error("Case type not found");
  }

  // Handle Deep Merging for JSONB name field
  const updates = { ...data };
  if (data.name && typeof data.name === 'object') {
    updates.name = { ...caseType.name, ...data.name };
  }

  await caseType.update(updates);
  return caseType;
};

// ✅ DELETE CASE TYPE
const deleteCaseType = async (id) => {
  const caseType = await CaseType.findByPk(id);

  if (!caseType) {
    throw new Error("Case type not found");
  }

  await caseType.destroy();
  return { message: "Case type deleted successfully" };
};

module.exports = {
  createCaseType,
  getAllCaseTypes,
  getCaseTypeById,
  updateCaseType,
  deleteCaseType,
};