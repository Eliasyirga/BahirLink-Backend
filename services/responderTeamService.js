const { ResponderTeam, Kebele } = require("../models");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const createTeam = async (data) => {
  const { name, username, email, password, phone, agencyId, status, kebeles } =
    data;

  if (
    !name ||
    !username ||
    !email ||
    !password ||
    !agencyId ||
    !kebeles ||
    kebeles.length === 0
  ) {
    throw new Error(
      "Name, username, email, password, agencyId, and at least one kebele are required",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const team = await ResponderTeam.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone,
    agencyId,
    status: status || "active",
  });

  // Assign kebeles by updating their responderTeamId
  await Kebele.update({ responderTeamId: team.id }, { where: { id: kebeles } });

  // Return team with its assigned kebeles
  return await ResponderTeam.findByPk(team.id, {
    include: { model: Kebele, as: "kebeles" },
  });
};

const updateTeam = async (id, data) => {
  const team = await ResponderTeam.findByPk(id);
  if (!team) throw new Error("Responder Team not found");

  const { password, kebeles, ...teamData } = data;

  if (password) {
    teamData.password = await bcrypt.hash(password, 10);
  }

  await team.update(teamData);

  if (kebeles) {
    if (!Array.isArray(kebeles) || kebeles.length === 0)
      throw new Error("At least one kebele must be provided");

    await Kebele.update(
      { responderTeamId: null },
      { where: { responderTeamId: id } },
    );

    await Kebele.update({ responderTeamId: id }, { where: { id: kebeles } });
  }

  return await ResponderTeam.findByPk(id, {
    include: { model: Kebele, as: "kebeles" },
  });
};

const deleteTeam = async (id) => {
  const team = await ResponderTeam.findByPk(id);
  if (!team) throw new Error("Responder Team not found");

  await team.destroy();
  return { message: "Responder Team deleted successfully" };
};

const getAllTeams = async () => {
  return await ResponderTeam.findAll({
    include: { model: Kebele, as: "kebeles" },
    order: [["createdAt", "DESC"]],
  });
};

const getTeamsByAgency = async (agencyId) => {
  if (!agencyId) throw new Error("Agency ID is required");

  return await ResponderTeam.findAll({
    where: { agencyId },
    include: { model: Kebele, as: "kebeles" },
    order: [["createdAt", "DESC"]],
  });
};

/**
 * Login for responder
 */
const loginResponder = async (email, password) => {
  if (!email || !password) throw new Error("Email and password are required");

  const responder = await ResponderTeam.findOne({
    where: { email },
    include: { model: Kebele, as: "kebeles" }, // fetch assigned kebeles
  });

  if (!responder) throw new Error("Responder not found");

  if (responder.status !== "active")
    throw new Error("Responder account is inactive");

  const isMatch = await bcrypt.compare(password, responder.password);
  if (!isMatch) throw new Error("Invalid password");

  const token = jwt.sign(
    {
      id: responder.id,
      email: responder.email,
      agencyId: responder.agencyId,
      role: "responder",
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );

  return {
    responder: {
      id: responder.id,
      name: responder.name,
      email: responder.email,
      phone: responder.phone,
      agencyId: responder.agencyId,
      kebeles: responder.kebeles,
      status: responder.status,
    },
    token,
  };
};

module.exports = {
  createTeam,
  updateTeam,
  deleteTeam,
  loginResponder,
  getAllTeams,
  getTeamsByAgency,
};
