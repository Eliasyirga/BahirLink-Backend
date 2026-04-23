const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

const caseIncludes = [
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

const createCase = async (data) => {
  // 1. Destructure for validation
  const { responderTeamId, caseTypeId, lastSeenLocationId, ...rest } = data;

  // 2. Verify the Team exists (Mechanical necessity for agencyId)
  const team = await ResponderTeam.findByPk(responderTeamId);
  if (!team) {
    throw new Error(`Responder Team ID ${responderTeamId} not found.`);
  }

  // 3. Create Case with strict type mapping
  try {
    const newCase = await Cases.create({
      ...rest,
      responderTeamId: Number(responderTeamId),
      caseTypeId: Number(caseTypeId),
      agencyId: team.agencyId, // Pull from DB to ensure validity
      lastSeenLocationId: lastSeenLocationId
        ? Number(lastSeenLocationId)
        : null,
      status: "pending",
    });

    // 4. Return with all associated models (Kebele, Agency, etc.)
    return await Cases.findByPk(newCase.id, { include: { all: true } });
  } catch (dbError) {
    console.error("Sequelize DB Error:", dbError);
    throw new Error(`Database Error: ${dbError.message}`);
  }
};
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
