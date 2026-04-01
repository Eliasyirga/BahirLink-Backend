const ResponderTeam = require("../models/ResponderTeam");
const bcrypt = require("bcryptjs");

/**
 * Create a Responder Team with login credentials and kebeles
 * data: { name, username, email, password, phone, agencyId, status, kebeles: [] }
 */
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

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create the responder team
  const team = await ResponderTeam.create({
    name,
    username,
    email,
    password: hashedPassword,
    phone,
    agencyId,
    status: status || "active",
    kebeles,
  });

  return team;
};

/**
 * Update a Responder Team (attributes + kebeles + optional password)
 * data: { name?, username?, email?, password?, phone?, status?, kebeles? }
 */
const updateTeam = async (id, data) => {
  const team = await ResponderTeam.findByPk(id);
  if (!team) throw new Error("Responder Team not found");

  const { password, kebeles, ...teamData } = data;

  // Hash new password if provided
  if (password) {
    teamData.password = await bcrypt.hash(password, 10);
  }

  // Update team attributes
  await team.update(teamData);

  // Update kebeles if provided
  if (kebeles) {
    if (!Array.isArray(kebeles) || kebeles.length === 0)
      throw new Error("At least one kebele must be provided");
    await team.update({ kebeles });
  }

  return team;
};

/**
 * Delete a Responder Team
 */
const deleteTeam = async (id) => {
  const team = await ResponderTeam.findByPk(id);
  if (!team) throw new Error("Responder Team not found");

  await team.destroy();
  return { message: "Responder Team deleted successfully" };
};

const getAllTeams = async () => {
  const teams = await ResponderTeam.findAll({
    order: [["createdAt", "DESC"]], // newest first
  });
  return teams;
};

const getTeamsByAgency = async (agencyId) => {
  if (!agencyId) throw new Error("Agency ID is required");

  const teams = await ResponderTeam.findAll({
    where: { agencyId },
    order: [["createdAt", "DESC"]],
  });

  return teams;
};

const loginResponder = async (email, password) => {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  // Find responder
  const responder = await ResponderTeam.findOne({
    where: { email },
  });

  if (!responder) {
    throw new Error("Responder not found");
  }

  // Check status
  if (responder.status !== "active") {
    throw new Error("Responder account is inactive");
  }

  // Compare password
  const isMatch = await bcrypt.compare(password, responder.password);

  if (!isMatch) {
    throw new Error("Invalid password");
  }

  // Create JWT token
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
