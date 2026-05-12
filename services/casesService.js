const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");

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
      }
    }

    if (value && typeof value === "object") {
      if (lang === "all") {
        plainItem[field] = value;
      } else {
        plainItem[field] =
          value[lang] || value["en"] || Object.values(value)[0] || "";
      }
    }
  });

  // ✅ STEP 3: Handle nested objects (like caseType.name)
  if (plainItem.caseType && plainItem.caseType.name) {
    let ctName = plainItem.caseType.name;
    if (typeof ctName === "string") {
      try {
        ctName = JSON.parse(ctName);
      } catch (e) {}
    }
    if (typeof ctName === "object") {
      plainItem.caseType.name =
        lang === "all" ? ctName : ctName[lang] || ctName["en"];
    }
  }

  return plainItem;
};

// Config for fields that require localization
const multiLangFields = ["fullName", "description", "distinctiveFeatures"];

const caseIncludes = [
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

/**
 * ✅ GET ALL CASES
 */
const getAllCases = async (lang = "en") => {
  const cases = await Cases.findAll({
    include: caseIncludes,
    order: [
      ["priority", "DESC"],
      ["createdAt", "DESC"],
    ],
  });
  return cases.map((c) => localize(c, lang, multiLangFields));
};

/**
 * ✅ GET CASE BY ID
 */
const getCaseById = async (id, lang = "en") => {
  const singleCase = await Cases.findByPk(id, { include: caseIncludes });
  if (!singleCase) throw new Error("Case record not found.");
  return localize(singleCase, lang, multiLangFields);
};

/**
 * ✅ CREATE CASE
 */
const createCase = async (data) => {
  const rTeamId = data.responderTeamId ? Number(data.responderTeamId) : null;
  if (!rTeamId) throw new Error("Responder Team ID is required.");

  const team = await ResponderTeam.findByPk(rTeamId);
  if (!team) throw new Error(`Responder Team ID ${rTeamId} not found.`);

  const {
    caseTypeId,
    lastSeenLocationId,
    age,
    reward,
    height,
    weight,
    isDangerous,
    fullName,
    description,
    distinctiveFeatures,
    ...rest
  } = data;

  const newCase = await Cases.create({
    ...rest,
    // Convert incoming data to structured JSONB
    fullName: processLocalization(fullName, "Unknown Case"),
    description: processLocalization(description),
    distinctiveFeatures: processLocalization(distinctiveFeatures),

    responderTeamId: rTeamId,
    agencyId: team.agencyId,
    caseTypeId: caseTypeId ? parseInt(caseTypeId, 10) : null,
    lastSeenLocationId: lastSeenLocationId
      ? parseInt(lastSeenLocationId, 10)
      : null,
    age: age ? parseInt(age, 10) : null,
    height: height ? parseInt(height, 10) : null,
    weight: weight ? parseInt(weight, 10) : null,
    reward: reward ? parseFloat(reward) : 0.0,
    isDangerous: isDangerous === "true" || isDangerous === true,
    status: "pending",
  });

  return await getCaseById(newCase.id, "all");
};

/**
 * ✅ HELPER: Prepares data for JSONB storage
 */
const processLocalization = (value, fallback = "") => {
  if (typeof value === "object" && value !== null) {
    return { en: value.en || fallback, am: value.am || "" };
  }
  return { en: value || fallback, am: "" };
};

/**
 * ✅ UPDATE CASE
 */
const updateCase = async (id, updates) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  // Merge JSONB fields to prevent overwriting existing translations
  multiLangFields.forEach((field) => {
    if (updates[field] && typeof updates[field] === "object") {
      updates[field] = { ...singleCase[field], ...updates[field] };
    }
  });

  await singleCase.update(updates);
  return await getCaseById(id, "all");
};

/**
 * ✅ DELETE CASE
 */
const deleteCase = async (id) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");
  await singleCase.destroy();
  return { success: true, message: "Case purged successfully" };
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  deleteCase,
};
