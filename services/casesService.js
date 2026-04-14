const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

/**
 * Create a new case
 * Logic: Includes new Wanted/Missing attributes and auto-assigns Agency
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
    // --- NEW ATTRIBUTES ---
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

  // 2. Create the case with all specialized attributes
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
    // --- NEW FIELDS ---
    reward: reward || 0.0,
    priority: priority || "medium",
    lastSeenDate: lastSeenDate || null,
    height: height || null,
    weight: weight || null,
    distinctiveFeatures: distinctiveFeatures || null,
    isDangerous: isDangerous || false,
  });

  // 3. Return the full object with associations
  return await Cases.findByPk(newCase.id, {
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
  });
};

/**
 * Get all cases (Ordered by Priority and Date)
 */
const getAllCases = async () => {
  return await Cases.findAll({
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
      { model: Kebele, attributes: ["id", "name"] },
    ],
    // Sort by priority (if you want critical first) and then by date
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
 * Logic: Allow transition to 'resolved' for closed cases
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
