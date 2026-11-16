const {
  ResponderTeam,
  Kebele,
  ResponderTeamKebele,
  Agency,
} = require("../models");
const bcrypt = require("bcryptjs");
const { Op } = require("sequelize");
const { generateAccessToken } = require("../utils/token");

// Fields editable by a system admin / the owning agency, and by the team itself.
const MANAGER_EDITABLE_FIELDS = ["name", "username", "email", "phone", "status"];
const SELF_EDITABLE_FIELDS = ["email", "phone"];

const httpError = (message, statusCode) => {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
};

const createTeam = async (data) => {
  const { name, username, email, password, phone, agencyId, status, kebeles } =
    data;

  if (
    !name ||
    !username ||
    !email ||
    !password ||
    !agencyId ||
    !Array.isArray(kebeles) ||
    kebeles.length === 0
  ) {
    throw new Error(
      "Name, username, email, password, agencyId, and at least one kebele are required",
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  // 🔥 CHECK: prevent duplicate kebele assignment in same agency
  const existing = await ResponderTeamKebele.findAll({
    where: {
      kebeleId: kebeles,
      agencyId,
    },
  });

  if (existing.length > 0) {
    const usedIds = existing.map((e) => e.kebeleId);
    throw new Error(
      `Kebele(s) already assigned in this agency: ${usedIds.join(", ")}`,
    );
  }

  // 1. Create team
  const team = await ResponderTeam.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone,
    agencyId,
    status: status || "active",
  });

  // 2. Assign kebeles
  await team.addKebeles(kebeles, {
    through: { agencyId },
  });

  // 3. Return with kebeles (defaultScope excludes the password hash)
  return await ResponderTeam.findByPk(team.id, {
    include: {
      model: Kebele,
      as: "kebeles",
      through: { attributes: [] },
    },
  });
};

/**
 * Update Responder Team + reassign kebeles.
 * opts.self === true → the responder team editing its own account
 * (email/phone; password change requires oldPassword; no kebele changes).
 */
const updateTeam = async (id, data = {}, opts = {}) => {
  const team = await ResponderTeam.unscoped().findByPk(id);
  if (!team) throw httpError("Responder Team not found", 404);

  const allowed = opts.self ? SELF_EDITABLE_FIELDS : MANAGER_EDITABLE_FIELDS;
  const teamData = {};
  allowed.forEach((f) => {
    if (data[f] !== undefined) teamData[f] = data[f];
  });

  // hash password if updated
  if (data.password) {
    if (opts.self) {
      const ok =
        data.oldPassword &&
        (await bcrypt.compare(String(data.oldPassword), team.password));
      if (!ok) throw httpError("Current password incorrect", 400);
    }
    teamData.password = await bcrypt.hash(String(data.password), 10);
  }

  await team.update(teamData);

  const kebeles = opts.self ? undefined : data.kebeles;

  // update kebele assignments
  if (kebeles !== undefined) {
    if (!Array.isArray(kebeles) || kebeles.length === 0) {
      throw httpError("At least one kebele must be provided", 400);
    }

    // remove all old relations
    await team.setKebeles([]);

    // add new ones
    await team.addKebeles(kebeles, {
      through: { agencyId: team.agencyId },
    });
  }

  return await ResponderTeam.findByPk(id, {
    include: {
      model: Kebele,
      as: "kebeles",
      through: { attributes: [] },
    },
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
    include: {
      model: Kebele,
      as: "kebeles",
      through: { attributes: [] },
    },
    order: [["createdAt", "DESC"]],
  });
};

const getTeamsByAgency = async (agencyId) => {
  if (!agencyId) throw new Error("Agency ID is required");

  return await ResponderTeam.findAll({
    where: { agencyId },
    include: {
      model: Kebele,
      as: "kebeles",
      through: { attributes: [] },
    },
    order: [["createdAt", "DESC"]],
  });
};

const loginResponder = async (email, password) => {
  const generic = httpError("Invalid email or password", 401);
  if (!email || !password) throw generic;

  const responder = await ResponderTeam.unscoped().findOne({
    where: { email },
    include: {
      model: Kebele,
      as: "kebeles",
      through: { attributes: [] },
    },
  });

  if (!responder) throw generic;

  const isMatch = await bcrypt.compare(String(password), responder.password);
  if (!isMatch) throw generic;

  if (responder.status !== "active") {
    throw httpError("Responder account is inactive", 403);
  }

  const token = generateAccessToken(
    responder.id,
    "responder",
    "responder",
    { email: responder.email, agencyId: responder.agencyId },
    "1d",
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

const getTeamById = async (id) => {
  return await ResponderTeam.findByPk(id, {
    include: [
      {
        model: Kebele,
        as: "kebeles",
        through: { attributes: [] },
      },
    ],
  });
};
const fetchTeamsByMultipleAgencyTypeNames = async (namesList) => {
  return await ResponderTeam.findAll({
    include: [
      {
        model: Agency,
        as: "agency",
        required: true,
        where: {
          name: {
            [Op.in]: namesList,
          },
        },
      },
    ],
  });
};

module.exports = {
  createTeam,
  updateTeam,
  deleteTeam,
  loginResponder,
  getAllTeams,
  getTeamsByAgency,
  getTeamById,
  fetchTeamsByMultipleAgencyTypeNames,
};
