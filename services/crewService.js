const Crew = require("../models/Crew");
const bcrypt = require("bcryptjs");
const { generateAccessToken } = require("../utils/token");

const STAFF_EDITABLE_FIELDS = [
  "name",
  "username",
  "email",
  "phone",
  "status",
  "roleId",
  "responderTeamId",
];
const SELF_EDITABLE_FIELDS = ["name", "phone"];

const sanitizeCrew = (crew) => {
  if (!crew) return crew;
  const plain = typeof crew.toJSON === "function" ? crew.toJSON() : { ...crew };
  delete plain.password;
  return plain;
};

const createCrew = async (data) => {
  const {
    name,
    username,
    email,
    password,
    phone,
    status,
    responderTeamId,
    roleId,
  } = data;

  if (
    !name ||
    !username ||
    !email ||
    !password ||
    !responderTeamId ||
    !roleId
  ) {
    throw new Error(
      "Name, username, email, password, responderTeamId, and roleId are required",
    );
  }

  const existingUsername = await Crew.findOne({ where: { username } });
  if (existingUsername) throw new Error("Username already exists");

  const existingEmail = await Crew.findOne({ where: { email } });
  if (existingEmail) throw new Error("Email already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const crew = await Crew.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone,
    status: status || "active",
    responderTeamId,
    roleId,
  });

  return sanitizeCrew(crew);
};

/**
 * opts.self === true → a crew member editing their own profile
 * (name, phone, password only).
 */
const updateCrew = async (id, data = {}, opts = {}) => {
  const crew = await Crew.unscoped().findByPk(id);
  if (!crew) throw new Error("Crew member not found");

  const allowed = opts.self ? SELF_EDITABLE_FIELDS : STAFF_EDITABLE_FIELDS;
  const updates = {};
  allowed.forEach((f) => {
    if (data[f] !== undefined) updates[f] = data[f];
  });

  if (updates.username && updates.username !== crew.username) {
    const existingUsername = await Crew.findOne({
      where: { username: updates.username },
    });
    if (existingUsername) throw new Error("Username already exists");
  }

  if (updates.email && updates.email !== crew.email) {
    const existingEmail = await Crew.findOne({ where: { email: updates.email } });
    if (existingEmail) throw new Error("Email already exists");
  }

  if (data.password) {
    updates.password = await bcrypt.hash(String(data.password), 10);
  }

  await crew.update(updates);

  return sanitizeCrew(crew);
};

const deleteCrew = async (id) => {
  const crew = await Crew.findByPk(id);
  if (!crew) throw new Error("Crew member not found");

  await crew.destroy();
  return { message: "Crew member deleted successfully" };
};

const loginCrew = async (data = {}) => {
  const { email, password } = data;
  const generic = new Error("Invalid email or password");

  if (!email || !password) throw generic;

  const crew = await Crew.unscoped().findOne({ where: { email } });
  if (!crew) throw generic;

  const isMatch = await bcrypt.compare(String(password), crew.password);
  if (!isMatch) throw generic;

  const token = generateAccessToken(
    crew.id,
    "crew",
    "crew",
    { responderTeamId: crew.responderTeamId },
    "1d",
  );

  return {
    token,
    crew: {
      id: crew.id,
      name: crew.name,
      username: crew.username,
      email: crew.email,
      roleId: crew.roleId,
      responderTeamId: crew.responderTeamId,
      status: crew.status,
    },
  };
};

module.exports = {
  createCrew,
  updateCrew,
  deleteCrew,
  loginCrew,
};
