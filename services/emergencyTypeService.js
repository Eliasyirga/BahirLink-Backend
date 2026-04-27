const { EmergencyType, Category } = require("../models");

/**
 * CREATE Emergency Type
 */
const createEmergencyType = async (data) => {
  try {
    const emergencyType = await EmergencyType.create({
      name: data.name,
      description: data.description || null,
    });

    return emergencyType;
  } catch (err) {
    console.error("Error creating EmergencyType:", err);
    throw err;
  }
};

/**
 * DELETE Emergency Type
 */
const deleteEmergencyType = async (id) => {
  try {
    const deleted = await EmergencyType.destroy({
      where: { id },
    });

    return deleted > 0;
  } catch (err) {
    console.error("Error deleting EmergencyType:", err);
    throw err;
  }
};

/**
 * GET ALL Emergency Types (with categories)
 */
const getAllEmergencyTypes = async () => {
  try {
    const emergencyTypes = await EmergencyType.findAll({
      include: [
        {
          model: Category,
          as: "categories",
          attributes: ["id", "name"], // ✅ FIXED (removed "type")
        },
      ],
      order: [["name", "ASC"]],
    });

    return emergencyTypes;
  } catch (err) {
    console.error("Error fetching EmergencyTypes:", err);
    throw err;
  }
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};
