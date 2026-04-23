const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

const caseIncludes = [
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

const createCase = async (data) => {
  // 1. Convert IDs to Numbers immediately to ensure DB lookups and storage work
  const rTeamId = data.responderTeamId ? Number(data.responderTeamId) : null;
  const cTypeId = data.caseTypeId ? Number(data.caseTypeId) : null;
  const lLocationId = data.lastSeenLocationId
    ? Number(data.lastSeenLocationId)
    : null;

  // 2. Verify the Team exists
  if (!rTeamId) {
    throw new Error("Responder Team ID is required.");
  }

  const team = await ResponderTeam.findByPk(rTeamId);
  if (!team) {
    throw new Error(`Responder Team ID ${rTeamId} not found.`);
  }

  // 3. Clean the rest of the data (remove the raw strings so they don't conflict)
  const { responderTeamId, caseTypeId, lastSeenLocationId, agencyId, ...rest } =
    data;

  try {
    const newCase = await Cases.create({
      ...rest,
      // Use the guaranteed numeric values
      responderTeamId: rTeamId,
      caseTypeId: cTypeId,
      agencyId: team.agencyId, // Pulled directly from the verified team
      lastSeenLocationId: lLocationId,
      // Ensure other numeric fields from 'rest' are also cast
      age: rest.age ? Number(rest.age) : null,
      reward: rest.reward ? Number(rest.reward) : 0,
      height: rest.height ? Number(rest.height) : null,
      weight: rest.weight ? Number(rest.weight) : null,
      status: "pending",
    });

    // 4. Return with associated models
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
