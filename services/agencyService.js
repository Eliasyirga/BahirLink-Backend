const Agency = require("../models/Agency");
const bcrypt = require("bcryptjs");

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

  agency.password = undefined;

  return agency;
};

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

const deleteAgency = async (id) => {
  const agency = await Agency.findByPk(id);
  if (!agency) throw new Error("Agency not found");

  await agency.destroy();
  return { message: "Agency deleted successfully" };
};

module.exports = {
  createAgency,
  updateAgency,
  deleteAgency,
};
