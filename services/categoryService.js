const { Category, EmergencyType } = require("../models");

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Parse whatever is stored in VARCHAR name column into { en, am }
const parseName = (raw) => {
  if (!raw) return { en: "", am: "" };
  // Already a plain JS object (Sequelize returned a parsed JSONB or the value was set as object)
  if (typeof raw === "object") return { en: raw.en || "", am: raw.am || "" };

  let str = String(raw).trim();

  // Strip surrounding quotes if the whole string was double-serialized: '"{ … }"'
  if (str.startsWith('"') && str.endsWith('"')) {
    str = str.slice(1, -1);
  }

  // Unescape escaped inner quotes:  \"  →  "
  str = str.replace(/\\"/g, '"');

  // Now try JSON.parse
  if (str.startsWith("{")) {
    try {
      const parsed = JSON.parse(str);
      if (parsed && typeof parsed === "object") {
        return { en: parsed.en || "", am: parsed.am || "" };
      }
    } catch {
      /* fall through */
    }
  }

  // Legacy plain string row
  return { en: str, am: "" };
};

// Always returns a plain display string (English preferred)
const toStr = (raw) => {
  const { en, am } = parseName(raw);
  return en || am || "";
};

// Stores ONLY the plain object — no double-stringify
// The value written to the DB is:  {"en":"Flood","am":"ጎርፍ"}
const serializeName = (en, am) =>
  JSON.stringify({ en: en || "", am: am || "" });

// ─────────────────────────────────────────────────────────────────────────────

const createCategory = async (data) => {
  const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);
  if (!emergencyType) throw new Error("EmergencyType not found");

  const nameEn =
    typeof data.name === "object" ? data.name.en || "" : data.name || "";
  const nameAm = typeof data.name === "object" ? data.name.am || "" : "";

  if (!nameEn.trim()) throw new Error("name.en is required");

  // Duplicate check
  const allInType = await Category.findAll({
    where: { emergencyTypeId: data.emergencyTypeId },
    attributes: ["id", "name"],
  });
  const duplicate = allInType.find(
    (c) => parseName(c.name).en.toLowerCase() === nameEn.trim().toLowerCase(),
  );
  if (duplicate)
    throw new Error(
      "Category with this name already exists in this EmergencyType",
    );

  const category = await Category.create({
    name: serializeName(nameEn.trim(), nameAm.trim()),
    emergencyTypeId: data.emergencyTypeId,
  });

  // Return name as a parsed object { en, am } — never a raw string
  return {
    id: category.id,
    name: parseName(category.name),
    emergencyTypeId: category.emergencyTypeId,
    emergencyType: {
      id: emergencyType.id,
      name: toStr(emergencyType.name),
    },
    type: toStr(emergencyType.name),
  };
};

const updateCategory = async (categoryId, data) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  const targetTypeId = data.emergencyTypeId ?? category.emergencyTypeId;

  if (data.emergencyTypeId) {
    const exists = await EmergencyType.findByPk(data.emergencyTypeId);
    if (!exists) throw new Error("EmergencyType not found");
  }

  const nameEn =
    typeof data.name === "object" ? data.name.en || "" : data.name || "";
  const nameAm = typeof data.name === "object" ? data.name.am || "" : "";

  if (nameEn.trim()) {
    const allInType = await Category.findAll({
      where: { emergencyTypeId: targetTypeId },
      attributes: ["id", "name"],
    });
    const duplicate = allInType.find(
      (c) =>
        String(c.id) !== String(categoryId) &&
        parseName(c.name).en.toLowerCase() === nameEn.trim().toLowerCase(),
    );
    if (duplicate)
      throw new Error(
        "Category with this name already exists in this EmergencyType",
      );
  }

  const existing = parseName(category.name);
  const finalEn = nameEn.trim() || existing.en;
  const finalAm = nameAm.trim() || existing.am;

  await category.update({
    name: serializeName(finalEn, finalAm),
    emergencyTypeId: targetTypeId,
  });

  // Re-fetch to get the freshly written value
  await category.reload();
  const updatedType = await EmergencyType.findByPk(category.emergencyTypeId);

  return {
    id: category.id,
    name: parseName(category.name),
    emergencyTypeId: category.emergencyTypeId,
    emergencyType: {
      id: updatedType.id,
      name: toStr(updatedType.name),
    },
    type: toStr(updatedType.name),
  };
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("Category not found");
  await category.destroy();
  return { message: "Category deleted successfully" };
};

const getAllCategories = async () => {
  const categories = await Category.findAll({
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
    order: [["id", "ASC"]],
  });

  return categories.map((cat) => {
    const plain = cat.get({ plain: true });
    return {
      id: plain.id,
      name: parseName(plain.name), // always { en, am } object
      emergencyTypeId: plain.emergencyTypeId,
      emergencyType: {
        id: plain.emergencyType?.id,
        name: toStr(plain.emergencyType?.name),
      },
      type: toStr(plain.emergencyType?.name),
    };
  });
};

const getCategoriesByEmergencyType = async (emergencyTypeId) => {
  const categories = await Category.findAll({
    where: { emergencyTypeId },
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
    order: [["id", "ASC"]],
  });

  return categories.map((cat) => {
    const plain = cat.get({ plain: true });
    return {
      id: plain.id,
      name: parseName(plain.name),
      emergencyTypeId: plain.emergencyTypeId,
      emergencyType: {
        id: plain.emergencyType?.id,
        name: toStr(plain.emergencyType?.name),
      },
      type: toStr(plain.emergencyType?.name),
    };
  });
};

const getCategoriesByAgencyId = async (agencyId) => {
  const { Agency, AgencyType } = require("../models");

  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });
  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = toStr(agency.agencyType?.name);
  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  const agencyTypeToEmergencyType = {
    Police: "Crime",
    Health: "Health",
    Fire: "Fire",
    Ambulance: "Health",
  };

  const targetName = agencyTypeToEmergencyType[agencyTypeName];
  if (!targetName)
    throw new Error(
      `No emergency type mapped for agency type "${agencyTypeName}"`,
    );

  const allTypes = await EmergencyType.findAll();
  const emergencyType = allTypes.find((t) => toStr(t.name) === targetName);
  if (!emergencyType)
    throw new Error(`EmergencyType "${targetName}" not found in DB`);

  const categories = await Category.findAll({
    where: { emergencyTypeId: emergencyType.id },
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
    order: [["id", "ASC"]],
  });

  return categories.map((cat) => {
    const plain = cat.get({ plain: true });
    return {
      id: plain.id,
      name: parseName(plain.name),
      emergencyTypeId: plain.emergencyTypeId,
      emergencyType: {
        id: plain.emergencyType?.id,
        name: toStr(plain.emergencyType?.name),
      },
      type: toStr(plain.emergencyType?.name),
    };
  });
};

module.exports = {
  createCategory,
  updateCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  getCategoriesByAgencyId,
};
