const Agency = require("../models/Agency");
const bcrypt = require("bcryptjs");

/**
 * Create a new Agency
 */
const createAgency = async (data) => {
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
    status: status || "active",
  });

  agency.password = undefined; // hide password
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

module.exports = {
  createAgency,
  updateAgency,
  deleteAgency,
  getAllAgencies, // export new function
};
