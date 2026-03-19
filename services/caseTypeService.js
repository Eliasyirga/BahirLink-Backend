const CaseType = require("../models/CaseType");


const createCaseType = async (data) => {
  const { name } = data;

  const existing = await CaseType.findOne({ where: { name } });
  if (existing) {
    throw new Error("Case type already exists");
  }

  return await CaseType.create({ name });
};

const getAllCaseTypes = async () => {
  return await CaseType.findAll({
    attributes: ["id", "name"],
    order: [["id", "ASC"]],
  });
};

const getCaseTypeById = async (id) => {
  const caseType = await CaseType.findByPk(id);

  if (!caseType) {
    throw new Error("Case type not found");
  }

  return caseType;
};

const updateCaseType = async (id, data) => {
  const caseType = await CaseType.findByPk(id);

  if (!caseType) {
    throw new Error("Case type not found");
  }

  await caseType.update(data);
  return caseType;
};

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