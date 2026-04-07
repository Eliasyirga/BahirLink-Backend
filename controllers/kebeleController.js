const {
  createKebele,
  updateKebele,
  deleteKebele,
  getAllKebeles,
  getKebelesByResponderTeam,
} = require("../services/kebeleService");

/**
 * Create Kebele
 * Optional: assign to a responder team via responderTeamId
 */
const createKebeleHandler = async (req, res) => {
  try {
    const { name, description, responderTeamId } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Kebele name is required" });
    }

    const kebele = await createKebele({ name, description, responderTeamId });

    res.status(201).json({
      message: "Kebele created successfully",
      data: kebele,
    });
  } catch (error) {
    console.error("CREATE KEBELE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Kebele
 * Can also update its assigned responder team
 */
const updateKebeleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, responderTeamId } = req.body;

    const kebele = await updateKebele(id, {
      name,
      description,
      responderTeamId,
    });

    res.status(200).json({
      message: "Kebele updated successfully",
      data: kebele,
    });
  } catch (error) {
    console.error("UPDATE KEBELE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete Kebele
 */
const deleteKebeleHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteKebele(id);

    res.status(200).json(result);
  } catch (error) {
    console.error("DELETE KEBELE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all Kebeles (optional: include their responder team)
 */
const getAllKebelesHandler = async (req, res) => {
  try {
    const { includeTeam } = req.query; // true/false

    const kebeles = await getAllKebeles(includeTeam === "true");

    res.status(200).json({ data: kebeles });
  } catch (error) {
    console.error("GET ALL KEBELES ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get Kebeles by Responder Team
 */
const getKebelesByResponderTeamHandler = async (req, res) => {
  try {
    const { responderTeamId } = req.params;
    if (!responderTeamId) {
      return res.status(400).json({ message: "Responder Team ID is required" });
    }

    const kebeles = await getKebelesByResponderTeam(responderTeamId);

    res.status(200).json({ data: kebeles });
  } catch (error) {
    console.error("GET KEBELES BY TEAM ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
  getAllKebelesHandler,
  getKebelesByResponderTeamHandler,
};
