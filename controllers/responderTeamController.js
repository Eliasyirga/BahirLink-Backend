const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ResponderTeam = require("../models/ResponderTeam");
const {
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeams,
  getTeamsByAgency,
} = require("../services/responderTeamService");

/**
 * Create a Responder Team
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
        message:
          "Name, username, email, password, agencyId, and at least one kebele are required",
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

    res.status(201).json({
      success: true,
      message: "Responder Team created successfully",
      data: team,
    });
  } catch (error) {
    console.error("CREATE TEAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
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

    const responder = await ResponderTeam.findOne({ where: { email } });
    if (!responder) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, responder.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const token = jwt.sign(
      { id: responder.id, role: "responder" },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "8h" },
    );

    res.status(200).json({ success: true, responder, token });
  } catch (error) {
    console.error("RESPONDER LOGIN ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
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

    res.status(200).json({
      success: true,
      message: "Responder Team updated successfully",
      data: team,
    });
  } catch (error) {
    console.error("UPDATE TEAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Delete a Responder Team
 */
const deleteTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteTeam(id);

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    console.error("DELETE TEAM ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get all Responder Teams
 */
const getAllTeamsHandler = async (req, res) => {
  try {
    const teams = await getAllTeams();
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error("GET ALL TEAMS ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Get Responder Teams by Agency
 */
const getTeamsByAgencyHandler = async (req, res) => {
  try {
    const { agencyId } = req.params;
    if (!agencyId) {
      return res
        .status(400)
        .json({ success: false, message: "Agency ID is required" });
    }

    const teams = await getTeamsByAgency(agencyId);
    res.status(200).json({ success: true, data: teams });
  } catch (error) {
    console.error("GET TEAMS BY AGENCY ERROR:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTeamHandler,
  responderLoginHandler,
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler,
};
