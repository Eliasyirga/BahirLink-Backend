const {
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeams,
  getTeamsByAgency,
  loginResponder,
  getTeamById,
  fetchTeamsByMultipleAgencyTypeNames,
} = require("../services/responderTeamService");
const { canManageTeam } = require("../utils/ownership");
const { isSystemAdmin } = require("../middleware/auth");

const denied = (res) =>
  res.status(403).json({ success: false, message: "Access denied" });

const AGENCY_MAP = {
  service: [
    "medical", // Must match the database name exactly
    "municipal",
    "other",
  ],
  emergency: [
    "fire", // Must match the database name exactly
    "police",
  ],
};

const getTeamByIdHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res
        .status(400)
        .json({ success: false, message: "Team ID is required" });
    }

    const team = await getTeamById(id);
    if (!team) {
      return res
        .status(404)
        .json({ success: false, message: "Responder Team not found" });
    }
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
    const { name, username, email, password, phone, status, kebeles } =
      req.body;

    // Agencies can only create teams under themselves; system admins choose.
    let agencyId = req.body.agencyId;
    if (req.user.type === "agency") {
      agencyId = req.user.id;
    } else if (!isSystemAdmin(req.user)) {
      return denied(res);
    }

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
    if (!error.statusCode) console.error("RESPONDER LOGIN ERROR:", error);
    return res.status(error.statusCode || 401).json({
      success: false,
      message: error.statusCode ? error.message : "Invalid email or password",
    });
  }
};

/**
 * Update a Responder Team
 */
const updateTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!(await canManageTeam(req.user, id))) return denied(res);

    // A responder team editing itself gets the restricted self-service path.
    const self = req.user.type === "responder";
    const team = await updateTeam(id, req.body, { self });
    return res.status(200).json({
      success: true,
      message: "Responder Team updated successfully",
      data: team,
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);
    return res
      .status(error.statusCode || 500)
      .json({ success: false, message: error.message });
  }
};

/**
 * Delete a Responder Team
 */
const deleteTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.type === "responder") return denied(res);
    if (!(await canManageTeam(req.user, id))) return denied(res);
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
    const agencyId = Number(req.params.agencyId); // convert to number
    if (!agencyId || isNaN(agencyId)) {
      return res.status(400).json({
        success: false,
        message: "Valid agencyId is required",
      });
    }

    const teams = await getTeamsByAgency(agencyId);
    return res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error("Error fetching teams by agency:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getTeamsByAgencyTypeHandler = async (req, res) => {
  try {
    const { category } = req.query; // Expecting 'service' or 'emergency'

    if (!category) {
      return res.status(400).json({
        success: false,
        message: "Category parameter ('service' or 'emergency') is required.",
      });
    }

    // Grab the array of name strings ("Fire", "Police", etc.)
    const targetNamesList = AGENCY_MAP[category.toLowerCase()];

    if (!targetNamesList) {
      return res.status(400).json({
        success: false,
        message: "Invalid category. Must be 'service' or 'emergency'.",
      });
    }

    const teams = await fetchTeamsByMultipleAgencyTypeNames(targetNamesList);

    return res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (error) {
    console.error("Error in getTeamsByAgencyTypeHandler:", error);
    return res.status(500).json({
      success: false,
      message: "Server error while processing mapped type names.",
    });
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
  getTeamsByAgencyTypeHandler,
};
