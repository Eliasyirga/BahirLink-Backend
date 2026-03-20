const ResponderTeam = require("../models/ResponderTeam");
const {
  createTeam,
  updateTeam,
  deleteTeam,
  getAllTeams,
  getTeamsByAgency,
} = require("../services/responderTeamService");

/**
 * Create a Responder Team with login credentials and kebeles
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
 * Get all Responder Teams for a specific agency
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
  updateTeamHandler,
  deleteTeamHandler,
  getAllTeamsHandler,
  getTeamsByAgencyHandler, // <-- new export
};
