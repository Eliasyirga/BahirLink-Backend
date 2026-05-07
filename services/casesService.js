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
 * Reusable helper to ensure multi-language fields are saved as objects
 */
const processLocalization = (value, fallback = "") => {
  if (typeof value === "object" && value !== null) {
    return {
      en: value.en || fallback,
      am: value.am || ""
    };
  }
  // If string is sent, put it in the English slot by default
  return { en: value || fallback, am: "" };
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
 * Create a new case with strict type casting and JSONB processing
 */
const createCase = async (data) => {
  // 1. Mandatory Validation
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
    fullName,
    description,
    distinctiveFeatures,
    ...rest
  } = data;

  try {
    const newCase = await Cases.create({
      ...rest,
      // Handle JSONB Localized Fields
      fullName: processLocalization(fullName, "Unknown Case"),
      description: processLocalization(description),
      distinctiveFeatures: processLocalization(distinctiveFeatures),

      responderTeamId: rTeamId,
      agencyId: team.agencyId,

      caseTypeId: caseTypeId ? parseInt(caseTypeId, 10) : null,
      lastSeenLocationId: lastSeenLocationId ? parseInt(lastSeenLocationId, 10) : null,

      // Numeric parsing
      age: age && age !== "" ? parseInt(age, 10) : null,
      height: height && height !== "" ? parseInt(height, 10) : null,
      weight: weight && weight !== "" ? parseInt(weight, 10) : null,
      reward: reward && reward !== "" ? parseFloat(reward) : 0.0,

      isDangerous: isDangerous === "true" || isDangerous === true,
      status: "pending",
    });

    // 3. Return fully populated object
    return await getCaseById(newCase.id);
  } catch (dbError) {
    console.error("❌ Sequelize Creation Error:", dbError);
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
 * Update case with deep merging for JSONB fields
 */
const updateCase = async (id, updates) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  // If updating localized strings, merge with existing values so we don't wipe out Amharic when updating English
  if (updates.fullName && typeof updates.fullName === 'object') {
    updates.fullName = { ...singleCase.fullName, ...updates.fullName };
  }
  if (updates.description && typeof updates.description === 'object') {
    updates.description = { ...singleCase.description, ...updates.description };
  }

  await singleCase.update(updates);
  return await getCaseById(id);
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
  return { success: true, message: "Case successfully purged from registry" };
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam,
  updateCase,
  updateCaseStatus,
  deleteCase,
};