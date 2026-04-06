const Cases = require("../models/Cases");
const CaseType = require("../models/CaseType");
const Agency = require("../models/Agency");
const ResponderTeam = require("../models/ResponderTeam");
const Kebele = require("../models/Kebele");

/**
 * Create a new case
 */
const createCase = async (data) => {
  const {
    fullName,
    age,
    gender,
    description,
    lastSeenLocationId,
    mediaUrl,
    mediaType,
    contactInfo,
    caseTypeId,
    agencyId,
    responderTeamId,
  } = data;

  const newCase = await Cases.create({
    fullName,
    age,
    gender,
    description,
    lastSeenLocationId: lastSeenLocationId || null,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    contactInfo: contactInfo || null,
    caseTypeId,
    agencyId,
    responderTeamId,
    status: "pending",
  });

  const result = await Cases.findByPk(newCase.id, {
    include: [
      { model: Agency, attributes: ["id", "name"] },
      { model: CaseType, attributes: ["id", "name"] },
      { model: ResponderTeam, attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
  });

  return result;
};

/**
 * Get all cases
 */
const getAllCases = async () => {
  return await Cases.findAll({
    include: [
      { model: Agency, attributes: ["id", "name"] },
      { model: CaseType, attributes: ["id", "name"] },
      { model: ResponderTeam, attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Get one case by ID
 */
const getCaseById = async (id) => {
  const singleCase = await Cases.findByPk(id, {
    include: [
      { model: Agency, attributes: ["id", "name"] },
      { model: CaseType, attributes: ["id", "name"] },
      { model: ResponderTeam, attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
  });
  if (!singleCase) throw new Error("Case not found");
  return singleCase;
};

/**
 * Get all cases for a specific Responder Team
 */
const getCasesByResponderTeam = async (responderTeamId) => {
  const cases = await Cases.findAll({
    where: { responderTeamId },
    include: [
      { model: Agency, attributes: ["id", "name"] },
      { model: CaseType, attributes: ["id", "name"] },
      { model: ResponderTeam, attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
  return cases;
};

/**
 * Update case status
 */
const updateCaseStatus = async (id, status) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found");

  if (!["pending", "approved", "rejected"].includes(status)) {
    throw new Error("Invalid status value");
  }

  singleCase.status = status;
  await singleCase.save();

  return singleCase;
};

/**
 * Delete a case
 */
const deleteCase = async (id) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found");

  await singleCase.destroy();
  return { message: "Case deleted successfully" };
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam, // ✅ new
  updateCaseStatus,
  deleteCase,
};
