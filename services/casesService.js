const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models"); // Importing from index.js ensures aliases are registered

/**
 * Create a new case
 * Logic: Automatically fetches agencyId from the ResponderTeam record
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
    responderTeamId,
  } = data;

  // 1. Validate the Responder Team and extract their Agency ID
  const team = await ResponderTeam.findByPk(responderTeamId);
  if (!team) {
    throw new Error(`Responder Team with ID ${responderTeamId} not found.`);
  }

  const assignedAgencyId = team.agencyId;

  // 2. Create the case with the verified agencyId
  const newCase = await Cases.create({
    fullName,
    age,
    gender,
    description,
    lastSeenLocationId: lastSeenLocationId || null,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    contactInfo: contactInfo || null,
    caseTypeId: Number(caseTypeId),
    agencyId: assignedAgencyId,
    responderTeamId: Number(responderTeamId),
    status: "pending",
  });

  // 3. Return the full object using the aliases defined in models/index.js
  return await Cases.findByPk(newCase.id, {
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] }, // Kebele has no alias in your index.js
    ],
  });
};

/**
 * Get all cases
 */
const getAllCases = async () => {
  return await Cases.findAll({
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
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
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
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
  return await Cases.findAll({
    where: { responderTeamId },
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });
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
  getCasesByResponderTeam,
  updateCaseStatus,
  deleteCase,
};
