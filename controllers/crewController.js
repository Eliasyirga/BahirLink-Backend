const { createCrew, updateCrew, deleteCrew } = require("../services/crewService");

/**
 * Create a Crew member
 */
const createCrewHandler = async (req, res) => {
  try {
    const { name, username, email, password, phone, status, responderTeamId, roleId } = req.body;

    if (!name || !username || !email || !password || !responderTeamId || !roleId) {
      return res.status(400).json({
        message: "Name, username, email, password, responderTeamId, and roleId are required",
      });
    }

    const crew = await createCrew({
      name,
      username,
      email,
      password,
      phone,
      status,
      responderTeamId,
      roleId,
    });

    res.status(201).json({
      message: "Crew member created successfully",
      data: crew,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update a Crew member
 */
const updateCrewHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const crew = await updateCrew(id, data);

    res.status(200).json({
      message: "Crew member updated successfully",
      data: crew,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete a Crew member
 */
const deleteCrewHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteCrew(id);

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createCrewHandler,
  updateCrewHandler,
  deleteCrewHandler,
};