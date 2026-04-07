const {
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeams,
  getTeamsByAgency,
  loginResponder,
  getTeamById, // Ensure this is exported from your service
} = require("../services/responderTeamService");

/**
 * Get Single Team by ID
 * REQUIRED for frontend AddCasePage to sync agencyId
 */
const getTeamByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Team ID is required" });
    }

    const team = await getTeamById(id);
    return res.status(200).json(team); // Return direct object for easier frontend access
  } catch (error) {
    console.error("GET TEAM BY ID ERROR:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

/**
 * Create a new Responder Team
 */
const createTeamHandler = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      phone,
      agencyId,
      status,
      kebeles,
    } = req.body;

    if (
      !name ||
      !username ||
      !email ||
      !password ||
      !agencyId ||
      !kebeles ||
      kebeles.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields and at least one kebele are required",
      });
    }

    const team = await createTeam({
      name,
      username,
      email,
      password,
      phone,
      agencyId,
      status,
      kebeles,
    });

    return res.status(201).json({
      success: true,
      message: "Responder Team created successfully",
      data: team,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);

    if (error.name === "SequelizeUniqueConstraintError") {
      const field = error.errors[0].path;
      return res.status(400).json({
        success: false,
        message: `The ${field} "${error.errors[0].value}" is already taken.`,
      });
    }

    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Responder Login
 */
const responderLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required" });
    }

    const { responder, token } = await loginResponder(email, password);

    // Add explicit responderTeamId for frontend convenience
    const responderData = {
      ...responder,
      responderTeamId: responder.id,
    };

    return res.status(200).json({
      success: true,
      responder: responderData,
      token,
    });
  } catch (error) {
    console.error("RESPONDER LOGIN ERROR:", error);
    return res.status(401).json({ success: false, message: error.message });
  }
};

/**
 * Update a Responder Team
 */
const updateTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const team = await updateTeam(id, data);
    return res.status(200).json({
      success: true,
      message: "Responder Team updated successfully",
      data: team,
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a Responder Team
 */
const deleteTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTeam(id);
    return res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("DELETE TEAM ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all Responder Teams
 */
const getAllTeamsHandler = async (req, res) => {
  try {
    const teams = await getAllTeams();
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Responder Teams by Agency
 */
const getTeamsByAgencyHandler = async (req, res) => {
  try {
    const { agencyId } = req.params;
    const teams = await getTeamsByAgency(agencyId);
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeamHandler,
  responderLoginHandler,
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler,
  getTeamByIdHandler, // Exported for your routes
};
