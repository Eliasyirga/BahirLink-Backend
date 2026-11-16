const { Op } = require("sequelize");
const Agency = require("../models/Agency");
const AgencyType = require("../models/AgencyType");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");

if (!process.env.JWT_SECRET) {
  // Fail loudly: never sign agency tokens with a guessable fallback secret.
  throw new Error("JWT_SECRET environment variable is required");
}

// Fields a system admin may change on an agency.
const ADMIN_EDITABLE_FIELDS = [
  "name",
  "username",
  "email",
  "phone",
  "location",
  "status",
  "agencyTypeId",
];
// Fields an agency may change on its own account.
const SELF_EDITABLE_FIELDS = ["email", "phone", "location"];

const pick = (src = {}, fields) =>
  fields.reduce((acc, f) => {
    if (src[f] !== undefined) acc[f] = src[f];
    return acc;
  }, {});

const stripPassword = (agency) => {
  if (!agency) return agency;
  const plain = typeof agency.toJSON === "function" ? agency.toJSON() : { ...agency };
  delete plain.password;
  return plain;
};

/**
 * Create a new Agency
 */
const createAgency = async (data, adminId) => {
  // Accept adminId here
  const {
    name,
    username,
    password,
    email,
    phone,
    location,
    agencyTypeId,
    status,
  } = data;

  const existingAgency = await Agency.findOne({ where: { username } });
  if (existingAgency) {
    throw new Error("Username already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const agency = await Agency.create({
    name,
    username,
    password: hashedPassword,
    email,
    phone,
    location,
    agencyTypeId,
    createdBy: adminId, // CRITICAL: Save the ID of the admin who created this
    status: status || "active",
  });

  return stripPassword(agency);
};

/**
 * Update an existing Agency.
 * opts.self === true → the agency is editing its own account: only
 * SELF_EDITABLE_FIELDS, and a password change requires oldPassword.
 */
const updateAgency = async (id, data = {}, opts = {}) => {
  const agency = await Agency.unscoped().findByPk(id);
  if (!agency) throw new Error("Agency not found");

  const updates = pick(
    data,
    opts.self ? SELF_EDITABLE_FIELDS : ADMIN_EDITABLE_FIELDS,
  );

  if (data.password) {
    if (opts.self) {
      const ok =
        data.oldPassword &&
        (await bcrypt.compare(String(data.oldPassword), agency.password));
      if (!ok) {
        const err = new Error("Current password incorrect");
        err.statusCode = 400;
        throw err;
      }
    }
    updates.password = await bcrypt.hash(String(data.password), 10);
  }

  await agency.update(updates);

  return stripPassword(agency);
};

/**
 * Delete an Agency
 */
const deleteAgency = async (id) => {
  const agency = await Agency.findByPk(id);
  if (!agency) throw new Error("Agency not found");

  await agency.destroy();
  return { message: "Agency deleted successfully" };
};

/**
 * Get All Agencies
 */
const getAllAgencies = async () => {
  const agencies = await Agency.findAll({
    order: [["name", "ASC"]], // optional: order alphabetically
  });

  // Remove passwords before returning
  return agencies.map((agency) => {
    const { password, ...rest } = agency.toJSON();
    return rest;
  });
};

const loginAgency = async (identifier, password) => {
  const generic = new Error("Invalid email or password");
  if (!identifier || !password) throw generic;

  // The web login form sends the same value as both email and username.
  const agency = await Agency.unscoped().findOne({
    where: { [Op.or]: [{ email: identifier }, { username: identifier }] },
    include: [
      {
        model: AgencyType,
        as: "agencyType", // This MUST match the 'as' in your association definition
      },
    ],
  });

  if (!agency) throw generic;

  const isMatch = await bcrypt.compare(String(password), agency.password);
  if (!isMatch) throw generic;

  // Core claims { id, role: "agency", type: "agency" } plus the convenience
  // claims the web dashboard already reads from the token.
  const token = generateAccessToken(
    agency.id,
    "agency",
    "agency",
    {
      name: agency.name,
      email: agency.email,
      agencyTypeId: agency.agencyTypeId,
      agencyTypeName: agency.agencyType?.name,
    },
    "1d",
  );

  return { agency: stripPassword(agency), token };
};

/**
 * Fetch Agents by their creatorId
 * @param {number} adminId - The ID of the Admin who created the agents
 */
const getAgentsByCreatorId = async (adminId) => {
  const agents = await Agency.findAll({
    where: {
      createdBy: adminId, // This matches the column in your Agency model
    },
    order: [["createdAt", "DESC"]],
  });

  // Return clean data without passwords
  return agents.map((agent) => {
    const { password, ...rest } = agent.toJSON();
    return rest;
  });
};

module.exports = {
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies,
  loginAgency,
  getAgentsByCreatorId,
};
