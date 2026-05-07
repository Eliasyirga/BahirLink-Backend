const { CaseType } = require("../models");
const { sequelize } = require("../config/db");

/**
 * ✅ HELPER: Flattens localized JSONB fields
 */
const localize = (item, lang, fields = ["name"]) => {
  if (!item) return null;
  const plainItem = typeof item.get === "function" ? item.get({ plain: true }) : item;

  fields.forEach((field) => {
    let value = plainItem[field];
    
    // Parse if it's a string (Essential since your DB is currently storing as VARCHAR)
    if (typeof value === "string") {
      try { 
        value = JSON.parse(value); 
      } catch (e) {
        // If it's not valid JSON, we leave it as is
      }
    }

    if (value && typeof value === "object") {
      if (lang === "all") {
        plainItem[field] = value;
      } else {
        plainItem[field] = value[lang] || value["en"] || Object.values(value)[0] || "";
      }
    }
  });
  return plainItem;
};

/**
 * ✅ CREATE CASE TYPE
 */
const createCaseType = async (data) => {
  const { name } = data;
  const englishName = typeof name === 'object' ? name.en : name;

  // 1. Fetch all to check uniqueness manually 
  // (Safest way since sequelize.json fails on your VARCHAR column)
  const allTypes = await CaseType.findAll();
  const exists = allTypes.some(t => {
    let n = t.name;
    if (typeof n === 'string') { try { n = JSON.parse(n); } catch(e) {} }
    return n && n.en === englishName;
  });

  if (exists) {
    throw new Error(`Case type '${englishName}' already exists.`);
  }

  const formattedName = typeof name === 'string' 
    ? { en: name, am: "" } 
    : { en: name.en || "", am: name.am || "" };

  // Store as stringified JSON since your DB expects VARCHAR
  const newType = await CaseType.create({ name: JSON.stringify(formattedName) });
  return localize(newType, "all");
};

/**
 * ✅ GET ALL CASE TYPES
 */
const getAllCaseTypes = async (lang = "en") => {
  // Removed sequelize.json to prevent the "operator does not exist" crash
  const types = await CaseType.findAll({
    attributes: ["id", "name"],
  });
  
  // Localize first
  const localized = types.map(t => localize(t, lang));

  // Sort in JavaScript instead of SQL
  return localized.sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * ✅ GET CASE TYPE BY ID
 */
const getCaseTypeById = async (id, lang = "en") => {
  const caseType = await CaseType.findByPk(id);
  if (!caseType) throw new Error("Case type not found");

  return localize(caseType, lang);
};

/**
 * ✅ UPDATE CASE TYPE
 */
const updateCaseType = async (id, data) => {
  const caseType = await CaseType.findByPk(id);
  if (!caseType) throw new Error("Case type not found");

  let currentName = caseType.name;
  if (typeof currentName === 'string') {
    try { currentName = JSON.parse(currentName); } catch (e) { currentName = {}; }
  }

  const updates = { ...data };
  if (data.name && typeof data.name === 'object') {
    updates.name = JSON.stringify({ ...currentName, ...data.name });
  }

  await caseType.update(updates);
  return localize(caseType, "all");
};

/**
 * ✅ DELETE CASE TYPE
 */
const deleteCaseType = async (id) => {
  const caseType = await CaseType.findByPk(id);
  if (!caseType) throw new Error("Case type not found");

  await caseType.destroy();
  return { success: true, message: "Case type deleted successfully" };
};

module.exports = {
  createCaseType,
  getAllCaseTypes,
  getCaseTypeById,
  updateCaseType,
  deleteCaseType,
};