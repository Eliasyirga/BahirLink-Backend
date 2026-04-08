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
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Kebele name is required" });
    }

    const kebele = await createKebele({ name, description });

    res.status(201).json({
      message: "Kebele created successfully",
      data: kebele,
    });
  } catch (error) {
    console.error("CREATE KEBELE ERROR:", error);
    res.status(500).json({ message: error.message });
  }
};

const updateKebeleHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    const kebele = await updateKebele(id, {
      name,
      description,
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
const getAllKebelesHandler = async (req, res) => {
  try {
    const kebeles = await getAllKebeles();
    res.json(kebeles);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
  getAllKebelesHandler,
  getKebelesByResponderTeamHandler,
};
