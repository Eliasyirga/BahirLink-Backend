const Agency = require("../models/Agency");
const AgencyType = require("../models/AgencyType");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "your_secret_key";

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

  agency.password = undefined;
  return agency;
};

/**
 * Update an existing Agency
 */
const updateAgency = async (id, data) => {
  const agency = await Agency.findByPk(id);
  if (!agency) throw new Error("Agency not found");

  if (data.password) {
    data.password = await bcrypt.hash(data.password, 10);
  }

  await agency.update(data);

  agency.password = undefined;
  return agency;
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

const loginAgency = async (email, password) => {
  // 1️⃣ Find agency by email AND include the associated AgencyType
  const agency = await Agency.findOne({
    where: { email },
    include: [
      {
        model: AgencyType,
        as: "agencyType", // This MUST match the 'as' in your association definition
      },
    ],
  });

  if (!agency) {
    throw new Error("Invalid email or password");
  }

  // 2️⃣ Compare passwords
  const isMatch = await bcrypt.compare(password, agency.password);
  if (!isMatch) {
    throw new Error("Invalid email or password");
  }

  // 3️⃣ Generate JWT token
  // Added agencyTypeName to the payload so the frontend can check it easily from the token
  const token = jwt.sign(
    {
      id: agency.id,
      name: agency.name,
      email: agency.email,
      agencyTypeId: agency.agencyTypeId,
      agencyTypeName: agency.agencyType?.name, // Extracting the name from the joined model
    },
    JWT_SECRET,
    { expiresIn: "1d" },
  );

  // 4️⃣ Hide password before sending
  agency.password = undefined;

  // The 'agency' object now contains:
  // { id: ..., name: ..., agencyType: { id: ..., name: "Municipal" } }
  return { agency, token };
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
