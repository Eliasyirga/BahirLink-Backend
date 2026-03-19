const Cases = require("../models/Cases");
const CaseType = require("../models/CaseType");
const Agency = require("../models/Agency");
const ResponderTeam = require("../models/ResponderTeam");

/**
 * Create a new case (by Responder Team)
 * @param {Object} data - case details
 */
const createCase = async (data) => {
  const {
    fullName,
    age,
    gender,
    description,
    lastSeenLocation,
    image,
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
    lastSeenLocation: lastSeenLocation || null,
    image: image || null,
    contactInfo: contactInfo || null,
    caseTypeId,
    agencyId,
    responderTeamId,
    status: "pending", // default status
  });

  return newCase;
};

/**
 * Get all cases
 * @param {Boolean} onlyApproved - true to return only approved cases
 */
const getAllCases = async () => {
  const cases = await Cases.findAll({
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return cases;
};

/**
 * Get one case by ID
 * @param {Number} id
 */
const getCaseById = async (id) => {
  const singleCase = await Cases.findByPk(id, {
    include: [
      { model: Agency, as: "agency", attributes: ["id", "name"] },
      { model: CaseType, as: "caseType", attributes: ["id", "name"] },
      { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
    ],
  });

  if (!singleCase) throw new Error("Case not found");

  return singleCase;
};

/**
 * Update case status (approve/reject)
 * @param {Number} id
 * @param {String} status - "approved" | "rejected" | "pending"
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
 * @param {Number} id
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
  updateCaseStatus,
  deleteCase,
};
