const { createTeam, updateTeam, deleteTeam } = require("../services/responderTeamService");

/**
 * Create a Responder Team with login credentials and kebeles
 */
const createTeamHandler = async (req, res) => {
  try {
    const { name, username, email, password, phone, agencyId, status, kebeles } = req.body;

    if (!name || !username || !email || !password || !agencyId || !kebeles || kebeles.length === 0) {
      return res.status(400).json({
        message: "Name, username, email, password, agencyId, and at least one kebele are required",
      });
    }

    const team = await createTeam({ name, username, email, password, phone, agencyId, status, kebeles });

    res.status(201).json({
      message: "Responder Team created successfully",
      data: team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
      message: "Responder Team updated successfully",
      data: team,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a Responder Team
 */
const deleteTeamHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteTeam(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createTeamHandler,
  updateTeamHandler,
  deleteTeamHandler,
};