const { createKebele, updateKebele, deleteKebele } = require("../services/kebeleService");

/**
 * Create Kebele
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
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update Kebele
 */
const updateKebeleHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const kebele = await updateKebele(id, req.body);

    res.status(200).json({
      message: "Kebele updated successfully",
      data: kebele,
    });
  } catch (error) {
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
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createKebeleHandler,
  updateKebeleHandler,
  deleteKebeleHandler,
};