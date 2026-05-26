const { EmergencyType, Category } = require("../models");
const translate = require("google-translate-api-x");

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  // Already a complete object — nothing to do
  let data = typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en; // fallback so UI is never empty
    }
  }

  return data;
};

const localize = (item, lang, fields) => {
  if (!item) return null;

  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  fields.forEach((field) => {
    if (plain[field] && typeof plain[field] === "object") {
      plain[field] =
        plain[field][lang] ||
        plain[field]["en"] ||
        Object.values(plain[field])[0] ||
        "";
    }
  });

  // Recursively localize nested categories
  if (Array.isArray(plain.categories)) {
    plain.categories = plain.categories.map((cat) =>
      localize(cat, lang, ["name"])
    );
  }

  return plain;
};

// ─── SERVICE FUNCTIONS ───────────────────────────────────────────────────────

const createEmergencyType = async (data) => {
  if (!data.name) throw new Error("Name is required");

  const translatedName = await autoTranslate(data.name);
  const translatedDesc = data.description
    ? await autoTranslate(data.description)
    : null;

  const emergencyType = await EmergencyType.create({
    name: translatedName,
    description: translatedDesc,
  });

  return emergencyType.get({ plain: true });
};

const deleteEmergencyType = async (id) => {
  // Guard: prevent deleting a type that still has categories
  const categoryCount = await Category.count({ where: { emergencyTypeId: id } });
  if (categoryCount > 0) {
    throw new Error(
      `Cannot delete: ${categoryCount} category(ies) still reference this emergency type. Delete them first.`
    );
  }

  const deletedCount = await EmergencyType.destroy({ where: { id } });
  return deletedCount > 0;
};

const getAllEmergencyTypes = async (lang = "en") => {
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

  // "raw" / "all" → plain objects, name stays as { en, am }
  // Used by CategoryPage so id-filtering and getEnName() both work
  if (lang === "raw" || lang === "all") {
    return emergencyTypes.map((t) => t.get({ plain: true }));
  }

  // "en" / "am" → localized strings for UI consumers
  return emergencyTypes.map((type) =>
    localize(type, lang, ["name", "description"])
  );
};

module.exports = {
  createEmergencyType,
  deleteEmergencyType,
  getAllEmergencyTypes,
};