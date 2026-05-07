const { ServiceType, ServiceCategory } = require("../models");
const { sequelize } = require("../config/db");
const translate = require("google-translate-api-x");

/**
 * HELPER: Auto-Translate
 * Ensures we always store a full { en, am } object in the DB.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;
  let data = typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en; 
    }
  }
  return data;
};

const localize = (item, lang, fields) => {
  if (!item) return null;
  const plainItem = typeof item.get === "function" ? item.get({ plain: true }) : item;

  fields.forEach((field) => {
    let value = plainItem[field];

    // Manually parse if the DB returned a string instead of an object
    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (e) {
        // Keep as string if parsing fails
      }
    }

    if (value && typeof value === "object") {
      if (lang === "all") {
        plainItem[field] = value;
      } else {
        plainItem[field] = value[lang] || value["en"] || Object.values(value)[0];
      }
    }
  });

  // Recursively handle nested categories
  if (plainItem.categories) {
    plainItem.categories = plainItem.categories.map(cat => localize(cat, lang, ["name"]));
  }

  return plainItem;
};
/**
 * ✅ CREATE
 */
const createServiceType = async (data) => {
  // Uniqueness check for English name
  const englishName = typeof data.name === 'object' ? data.name.en : data.name;
  const existing = await ServiceType.findOne({
    where: sequelize.json("name.en", englishName),
  });

  if (existing) {
    throw new Error("Service type with this English name already exists");
  }

  const translatedName = await autoTranslate(data.name);
  const translatedDesc = await autoTranslate(data.description);

  return await ServiceType.create({
    ...data,
    name: translatedName,
    description: translatedDesc,
  });
};

/**
 * ✅ GET ALL
 * lang: 'en', 'am', or 'all'
 */
const getAllServiceTypes = async (lang = "en") => {
  const serviceTypes = await ServiceType.findAll({
    include: [
      {
        model: ServiceCategory,
        as: "categories",
        attributes: ["id", "name"],
      },
    ],
    order: [["id", "ASC"]],
  });

  if (lang === "all") {
    return serviceTypes;
  }

  return serviceTypes.map((type) =>
    localize(type, lang, ["name", "description"])
  );
};

/**
 * ✅ GET BY ID
 */
const getServiceTypeById = async (id, lang = "all") => {
  const serviceType = await ServiceType.findByPk(id, {
    include: [{ model: ServiceCategory, as: "categories" }]
  });

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  if (lang === "all") return serviceType;
  return localize(serviceType, lang, ["name", "description"]);
};

/**
 * ✅ UPDATE
 */
const updateServiceType = async (id, data) => {
  const serviceType = await ServiceType.findByPk(id);

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  // Deep merge to prevent overwriting translations
  const finalUpdates = { ...data };
  if (data.name) {
    const newName = typeof data.name === 'string' ? { en: data.name } : data.name;
    finalUpdates.name = { ...serviceType.name, ...newName };
  }
  if (data.description) {
    const newDesc = typeof data.description === 'string' ? { en: data.description } : data.description;
    finalUpdates.description = { ...serviceType.description, ...newDesc };
  }

  await serviceType.update(finalUpdates);
  return serviceType;
};

/**
 * ✅ DELETE
 */
const deleteServiceType = async (id) => {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) {
    throw new Error("Service type not found");
  }
  await serviceType.destroy();
  return { success: true, message: "Service type deleted successfully" };
};

module.exports = {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};