const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

/**
 * Standardized associations for consistent data retrieval
 */
const caseIncludes = [
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

/**
 * Create a new case with strict type casting
 */
const createCase = async (data) => {
  // 1. Mandatory Validation: Responder Team is the backbone of the case
  const rTeamId = data.responderTeamId ? Number(data.responderTeamId) : null;
  if (!rTeamId) throw new Error("Responder Team ID is required.");

  const team = await ResponderTeam.findByPk(rTeamId);
  if (!team) throw new Error(`Responder Team ID ${rTeamId} not found.`);

  // 2. Extract and sanitize input data
  const {
    caseTypeId,
    lastSeenLocationId,
    age,
    reward,
    height,
    weight,
    isDangerous,
    ...rest
  } = data;

  try {
    const newCase = await Cases.create({
      ...rest,
      // Foreign Keys
      responderTeamId: rTeamId,
      agencyId: team.agencyId, // Auto-synced from team
      caseTypeId: caseTypeId ? Number(caseTypeId) : null,
      lastSeenLocationId: lastSeenLocationId
        ? Number(lastSeenLocationId)
        : null,

      // Biometrics & Numbers (Explicitly cast to handle strings from FormData)
      age: age && age !== "" ? Number(age) : null,
      reward: reward && reward !== "" ? Number(reward) : 0,
      height: height && height !== "" ? Number(height) : null,
      weight: weight && weight !== "" ? Number(weight) : null,

      // Flags & Default Status
      isDangerous: isDangerous === "true" || isDangerous === true,
      status: "pending",
    });

    // 3. Return fully populated object
    return await getCaseById(newCase.id);
  } catch (dbError) {
    console.error("Sequelize Creation Error:", dbError);
    throw new Error(`Database Error: ${dbError.message}`);
  }
};

/**
 * Get all cases with sorting (Priority then Date)
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
  if (!singleCase) throw new Error("Case record not found in system.");
  return singleCase;
};

/**
 * Get all cases assigned to a specific team
 */
const getCasesByResponderTeam = async (responderTeamId) => {
  return await Cases.findAll({
    where: { responderTeamId },
    include: caseIncludes,
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Update case status with validation
 */
const updateCaseStatus = async (id, status) => {
  const validStatuses = ["pending", "approved", "rejected", "resolved"];
  if (!validStatuses.includes(status)) {
    throw new Error(`Invalid status deployment: ${status}`);
  }

  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  await singleCase.update({ status });
  return await getCaseById(id);
};

/**
 * Permanently remove a case
 */
const deleteCase = async (id) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  await singleCase.destroy();
  return { message: "Case successfully purged from registry" };
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam,
  updateCaseStatus,
  deleteCase,
};
