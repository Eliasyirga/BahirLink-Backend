// 1. IMPORT EVERYTHING FROM THE MODELS FOLDER (index.js)
// This ensures Sequelize, ResponderTeam, and Kebele are all initialized and linked
const { ResponderTeam, Kebele } = require("../models");
const { sequelize } = require("../config/db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Create a new Responder Team
 */
const createTeam = async (data) => {
  const { name, username, email, password, phone, agencyId, status, kebeles } =
    data;

  // Validation...
  if (
    !name ||
    !username ||
    !email ||
    !password ||
    !agencyId ||
    !kebeles ||
    kebeles.length === 0
  ) {
    throw new Error("Required fields missing or no kebeles selected");
  }

  // Now sequelize will NOT be undefined!
  const transaction = await sequelize.transaction();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    const team = await ResponderTeam.create(
      {
        name,
        username,
        email,
        password: hashedPassword,
        phone,
        agencyId,
        status: status || "active",
      },
      { transaction },
    );

    await Kebele.update(
      { responderTeamId: team.id },
      {
        where: { id: kebeles },
        transaction,
      },
    );

    await transaction.commit();

    return await ResponderTeam.findByPk(team.id, {
      include: { model: Kebele, as: "kebeles" },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};
/**
 * Update a Responder Team
 */
const updateTeam = async (id, data) => {
  const transaction = await sequelize.transaction();

  try {
    const team = await ResponderTeam.findByPk(id);
    if (!team) throw new Error("Responder Team not found");

    const { password, kebeles, ...teamData } = data;

    if (password) {
      teamData.password = await bcrypt.hash(password, 10);
    }

    await team.update(teamData, { transaction });

    if (kebeles) {
      // Clear old assignments
      await Kebele.update(
        { responderTeamId: null },
        { where: { responderTeamId: id }, transaction },
      );

      // Assign new ones
      await Kebele.update(
        { responderTeamId: id },
        { where: { id: kebeles }, transaction },
      );
    }

    await transaction.commit();

    return await ResponderTeam.findByPk(id, {
      include: { model: Kebele, as: "kebeles" },
    });
  } catch (error) {
    if (transaction) await transaction.rollback();
    throw error;
  }
};

/**
 * Delete a Responder Team
 */
const deleteTeam = async (id) => {
  const team = await ResponderTeam.findByPk(id);
  if (!team) throw new Error("Responder Team not found");

  // Unassign kebeles first
  await Kebele.update(
    { responderTeamId: null },
    { where: { responderTeamId: id } },
  );

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

const loginResponder = async (email, password) => {
  if (!email || !password) throw new Error("Email and password are required");

  const responder = await ResponderTeam.findOne({
    where: { email },
    include: { model: Kebele, as: "kebeles" },
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
  getAllTeams,
  getTeamsByAgency,
  loginResponder,
};
