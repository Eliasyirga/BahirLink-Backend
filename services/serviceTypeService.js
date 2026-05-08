const { ServiceType, ServiceCategory } = require("../models");
const { sequelize } = require("../config/db");
const translate = require("google-translate-api-x");

/**
 * HELPER: Auto-Translate
 * Ensures we always store a full { en, am } object in the DB.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;
  let data =
    typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en; // Fallback to English if translation fails
    }
  }
  return data;
};

/**
 * HELPER: Localize
 * Flattens JSONB objects into a single string based on requested language
 */
const localize = (item, lang, fields) => {
  if (!item) return null;
  const plainItem =
    typeof item.get === "function" ? item.get({ plain: true }) : item;

  fields.forEach((field) => {
    let value = plainItem[field];

    if (typeof value === "string") {
      try {
        value = JSON.parse(value);
      } catch (e) {
        /* keep as string */
      }
    }

    if (value && typeof value === "object") {
      if (lang === "all") {
        plainItem[field] = value;
      } else {
        // Core Logic: Requested -> English -> Amharic -> First Available
        plainItem[field] =
          value[lang] || value["en"] || value["am"] || Object.values(value)[0];
      }
    }
  });

  if (plainItem.categories) {
    plainItem.categories = plainItem.categories.map((cat) =>
      localize(cat, lang, ["name"]),
    );
  }

  return plainItem;
};

/**
 * ✅ CREATE
 */
const createServiceType = async (data) => {
  const englishName = typeof data.name === "object" ? data.name.en : data.name;

  const existing = await ServiceType.findOne({
    where: sequelize.json("name.en", englishName),
  });

  if (existing) {
    throw new Error("Service type with this English name already exists");
  }

  // Use the auto-translate helper to fill in missing gaps
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

  if (lang === "all") return serviceTypes;

  return serviceTypes.map((type) =>
    localize(type, lang, ["name", "description"]),
  );
};

/**
 * ✅ GET BY ID
 */
const getServiceTypeById = async (id, lang = "all") => {
  const serviceType = await ServiceType.findByPk(id, {
    include: [{ model: ServiceCategory, as: "categories" }],
  });

  if (!serviceType) throw new Error("Service type not found");

  if (lang === "all") return serviceType;
  return localize(serviceType, lang, ["name", "description"]);
};

/**
 * ✅ UPDATE
 */
const updateServiceType = async (id, data) => {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) throw new Error("Service type not found");

  if (data.name) {
    const englishName =
      typeof data.name === "object" ? data.name.en : data.name;
    const existing = await ServiceType.findOne({
      where: sequelize.json("name.en", englishName),
    });

    if (existing && existing.id !== parseInt(id)) {
      throw new Error("Service type name already in use");
    }
  }

  // Deep merge for JSONB to prevent overwriting existing translations
  const finalUpdates = { ...data };

  if (data.name) {
    const processedName = await autoTranslate(data.name);
    finalUpdates.name = { ...serviceType.name, ...processedName };
  }

  if (data.description) {
    const processedDesc = await autoTranslate(data.description);
    finalUpdates.description = { ...serviceType.description, ...processedDesc };
  }

  await serviceType.update(finalUpdates);
  return serviceType;
};

/**
 * ✅ DELETE
 */
const deleteServiceType = async (id) => {
  const serviceType = await ServiceType.findByPk(id);
  if (!serviceType) throw new Error("Service type not found");

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
