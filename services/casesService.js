const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

/**
 * REUSABLE INCLUDE CONFIGURATION
 * Since Kebele is aliased as "lastSeenLocation" in models/index.js,
 * we MUST use that alias here.
 */
const caseIncludes = [
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

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
    responderTeamId,
    reward,
    priority,
    lastSeenDate,
    height,
    weight,
    distinctiveFeatures,
    isDangerous,
  } = data;

  // 1. Validate the Responder Team and extract their Agency ID
  const team = await ResponderTeam.findByPk(responderTeamId);
  if (!team) {
    throw new Error(`Responder Team with ID ${responderTeamId} not found.`);
  }

  const assignedAgencyId = team.agencyId;

  // 2. Create the case
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
    reward: reward || 0.0,
    priority: priority || "medium",
    lastSeenDate: lastSeenDate || null,
    height: height || null,
    weight: weight || null,
    distinctiveFeatures: distinctiveFeatures || null,
    isDangerous: isDangerous || false,
  });

  // 3. Return the full object with corrected aliases
  return await Cases.findByPk(newCase.id, {
    include: caseIncludes,
  });
};

/**
 * Get all cases
 */
const getAllCases = async () => {
  return await Cases.findAll({
    include: caseIncludes,
    order: [
      ["priority", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
};

/**
 * Get one case by ID
 */
const getCaseById = async (id) => {
  const singleCase = await Cases.findByPk(id, {
    include: caseIncludes,
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
    include: caseIncludes,
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Update case status
 */
const updateCaseStatus = async (id, status) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found");

  const validStatuses = ["pending", "approved", "rejected", "resolved"];
  if (!validStatuses.includes(status)) {
    throw new Error(
      `Invalid status. Must be one of: ${validStatuses.join(", ")}`,
    );
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
