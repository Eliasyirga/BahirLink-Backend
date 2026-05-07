const { EmergencyType, Category } = require("../models");
const translate = require("google-translate-api-x");

/**
 * HELPER: Auto-Translate
 * Ensures we always store a full { en, am } object in the DB.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  // 1. Normalize: Always turn input into an object { en: "..." }
  let data = typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  // 2. Translate if Amharic is missing but English exists
  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en; // Fallback to English so the UI isn't empty
    }
  }
  return data;
};

/**
 * HELPER: Localize
 * Transforms { en: "Crime", am: "ወንጀል" } into a single string based on 'lang'.
 */
const localize = (item, lang, fields) => {
  if (!item) return null;

  // Convert Sequelize instance to plain JS object if necessary
  const plainItem = typeof item.get === "function" ? item.get({ plain: true }) : item;

  // Flatten the requested fields
  fields.forEach((field) => {
    if (plainItem[field] && typeof plainItem[field] === "object") {
      // Pick the language, fallback to English, then to the first available key
      plainItem[field] = plainItem[field][lang] || plainItem[field]["en"] || Object.values(plainItem[field])[0];
    }
  });

  // Handle nested categories localization
  if (plainItem.categories && Array.isArray(plainItem.categories)) {
    plainItem.categories = plainItem.categories.map((cat) => 
      localize(cat, lang, ["name"])
    );
  }

  return plainItem;
};

/**
 * CREATE Emergency Type
 */
const createEmergencyType = async (data) => {
  try {
    // Ensure name and description are saved as JSON objects
    const translatedName = await autoTranslate(data.name);
    const translatedDesc = await autoTranslate(data.description);

    const emergencyType = await EmergencyType.create({
      name: translatedName,
      description: translatedDesc,
    });

    return emergencyType;
  } catch (err) {
    console.error("Error in createEmergencyType service:", err);
    throw err;
  }
};

/**
 * DELETE Emergency Type
 */
const deleteEmergencyType = async (id) => {
  try {
    const deletedCount = await EmergencyType.destroy({ where: { id } });
    return deletedCount > 0;
  } catch (err) {
    console.error("Error in deleteEmergencyType service:", err);
    throw err;
  }
};

/**
 * GET ALL Emergency Types
 * Supports 'all' to return raw JSON or 'en'/'am' to return strings.
 */
const getAllEmergencyTypes = async (lang = "en") => {
  try {
    const emergencyTypes = await EmergencyType.findAll({
      include: [
        {
          model: Category,
          as: "categories",
          attributes: ["id", "name"],
        },
      ],
      order: [["id", "ASC"]],
    });

    // If the controller asks for 'all', return the raw DB rows (with JSON objects)
    if (lang === "all") {
      return emergencyTypes;
    }

    // Otherwise, localize each item for the frontend
    return emergencyTypes.map((type) =>
      localize(type, lang, ["name", "description"])
    );
  } catch (err) {
    console.error("Error in getAllEmergencyTypes service:", err);
    throw err;
  }
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};