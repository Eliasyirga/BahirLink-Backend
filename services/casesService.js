const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");
const translate = require("google-translate-api-x");

// ─── autoTranslate ────────────────────────────────────────────────────────────
// Mirrors the emergency service pattern:
//  • Detects input language automatically (no assumption it's English)
//  • Handles am→en as well as en→am
//  • Treats missing, null, or empty am as "needs translation"
//  • Falls back gracefully on any translate failure
const autoTranslate = async (fieldData) => {
  if (fieldData === null || fieldData === undefined) return null;

  // Normalise to a working object
  let data =
    typeof fieldData === "string" ? { _raw: fieldData } : { ...fieldData };

  // ── Raw string: detect language, then fill whichever side is missing ───────
  if (data._raw) {
    const rawText = data._raw;
    delete data._raw;

    try {
      const toEn = await translate(rawText, { to: "en" });
      const detectedLang = toEn.from?.language?.iso || "en";

      if (detectedLang === "am") {
        // Input was Amharic → store as am, translate to en
        data.am = rawText;
        data.en = toEn.text;
      } else {
        // Input was English (or other) → store as en, translate to am
        data.en = rawText;
        try {
          const toAm = await translate(rawText, { to: "am" });
          data.am = toAm.text;
        } catch (err) {
          console.error("en→am translation failed:", err.message);
          data.am = rawText;
        }
      }
    } catch (err) {
      console.error("Language detection / translation failed:", err.message);
      data.en = rawText;
      data.am = rawText;
    }

    return data;
  }

  // ── Already an object: fill whichever side is missing ────────────────────
  const amMissing = !data.am || data.am.toString().trim() === "";
  const enMissing = !data.en || data.en.toString().trim() === "";

  if (data.am && enMissing) {
    try {
      const toEn = await translate(data.am, { to: "en" });
      data.en = toEn.text;
    } catch (err) {
      console.error("am→en translation failed:", err.message);
      data.en = data.am;
    }
  }

  if (data.en && amMissing) {
    try {
      const toAm = await translate(data.en, { to: "am" });
      data.am = toAm.text;
    } catch (err) {
      console.error("en→am translation failed:", err.message);
      data.am = data.en;
    }
  }

  return data;
};

// ─── localize ─────────────────────────────────────────────────────────────────
const localize = (item, lang, fields) => {
  if (!item) return null;

  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  fields.forEach((field) => {
    let value = plain[field];
    if (typeof value === "string") {
      try { value = JSON.parse(value); } catch (_) {}
    }
    if (value && typeof value === "object") {
      plain[field] =
        lang === "all"
          ? value
          : value[lang] || value["en"] || Object.values(value)[0] || "";
    }
  });

  // Nested: caseType.name
  if (plain.caseType?.name) {
    let ctName = plain.caseType.name;
    if (typeof ctName === "string") {
      try { ctName = JSON.parse(ctName); } catch (_) {}
    }
    if (typeof ctName === "object") {
      plain.caseType.name =
        lang === "all"
          ? ctName
          : ctName[lang] || ctName["en"] || Object.values(ctName)[0] || "";
    }
  }

  return plain;
};

const multiLangFields = ["fullName", "description", "distinctiveFeatures"];

const caseIncludes = [
  { model: Agency,        as: "agency",          attributes: ["id", "name"] },
  { model: CaseType,      as: "caseType",         attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam",    attributes: ["id", "name"] },
  { model: Kebele,        as: "lastSeenLocation", attributes: ["id", "name"] },
];

// ─── GET ALL ──────────────────────────────────────────────────────────────────
const getAllCases = async (lang = "en") => {
  const cases = await Cases.findAll({
    include: caseIncludes,
    order: [["priority", "DESC"], ["createdAt", "DESC"]],
  });
  return cases.map((c) => localize(c, lang, multiLangFields));
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getCaseById = async (id, lang = "en") => {
  const singleCase = await Cases.findByPk(id, { include: caseIncludes });
  if (!singleCase) throw new Error("Case record not found.");
  return localize(singleCase, lang, multiLangFields);
};

// ─── CREATE ───────────────────────────────────────────────────────────────────
// Controller always passes plain strings — autoTranslate detects language and
// fills both en + am, so every new case is stored bilingual from day one.
const createCase = async (data) => {
  const rTeamId = data.responderTeamId ? Number(data.responderTeamId) : null;
  if (!rTeamId) throw new Error("Responder Team ID is required.");

  const team = await ResponderTeam.findByPk(rTeamId);
  if (!team) throw new Error(`Responder Team ID ${rTeamId} not found.`);

  const {
    caseTypeId, lastSeenLocationId,
    age, reward, height, weight, isDangerous,
    fullName, description, distinctiveFeatures,
    ...rest
  } = data;

  const [translatedName, translatedDesc, translatedFeatures] =
    await Promise.all([
      autoTranslate(fullName || "Unknown Case"),
      autoTranslate(description || ""),
      autoTranslate(distinctiveFeatures || ""),
    ]);

  const newCase = await Cases.create({
    ...rest,
    fullName:            translatedName,
    description:         translatedDesc,
    distinctiveFeatures: translatedFeatures,

    responderTeamId:    rTeamId,
    agencyId:           team.agencyId,
    caseTypeId:         caseTypeId         ? parseInt(caseTypeId, 10)         : null,
    lastSeenLocationId: lastSeenLocationId ? parseInt(lastSeenLocationId, 10) : null,
    age:                age                ? parseInt(age, 10)                : null,
    height:             height             ? parseInt(height, 10)             : null,
    weight:             weight             ? parseInt(weight, 10)             : null,
    reward:             reward             ? parseFloat(reward)               : 0.0,
    isDangerous:        isDangerous === "true" || isDangerous === true,
    status:             "pending",
  });

  return await getCaseById(newCase.id, "all");
};

// ─── UPDATE ───────────────────────────────────────────────────────────────────
const updateCase = async (id, updates) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  for (const field of multiLangFields) {
    if (!updates[field]) continue;

    const incoming = updates[field];

    // Needs translation when it's a raw string or the am side is missing/empty
    const amMissing =
      typeof incoming === "string" ||
      (typeof incoming === "object" &&
        incoming.en &&
        (!incoming.am || incoming.am.toString().trim() === ""));

    if (amMissing) {
      updates[field] = await autoTranslate(
        typeof incoming === "string" ? incoming : incoming.en
      );
    } else {
      // Both sides present — merge to preserve existing keys
      updates[field] = { ...singleCase[field], ...incoming };
    }
  }

  await singleCase.update(updates);
  return await getCaseById(id, "all");
};

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
const updateCaseStatus = async (id, status) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");
  await singleCase.update({ status });
  return localize(singleCase, "all", multiLangFields);
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteCase = async (id) => {
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");
  await singleCase.destroy();
  return { success: true, message: "Case purged successfully" };
};

// ─── BACKFILL TRANSLATIONS ────────────────────────────────────────────────────
// Call once (via a one-off admin route or a startup script) to retroactively
// translate any existing cases that were stored before auto-translation was
// added — i.e. cases whose text fields are plain strings or objects missing am.
//
// Returns a summary: { total, updated, skipped, failed }
const backfillTranslations = async () => {
  const allCases = await Cases.findAll();
  const summary = { total: allCases.length, updated: 0, skipped: 0, failed: 0 };

  for (const c of allCases) {
    let dirty = false;
    const updates = {};

    for (const field of multiLangFields) {
      let value = c[field];

      // Parse if stored as a JSON string
      if (typeof value === "string") {
        try { value = JSON.parse(value); } catch (_) {}
      }

      // Case A: plain string — needs full translate
      if (typeof value === "string" && value.trim() !== "") {
        try {
          updates[field] = await autoTranslate(value);
          dirty = true;
        } catch (err) {
          console.error(`❌ Backfill [${c.id}].${field}:`, err.message);
          summary.failed++;
        }
        continue;
      }

      // Case B: object missing am or en — fill the gap
      if (value && typeof value === "object") {
        const amMissing = !value.am || value.am.toString().trim() === "";
        const enMissing = !value.en || value.en.toString().trim() === "";

        if (amMissing || enMissing) {
          try {
            updates[field] = await autoTranslate(value);
            dirty = true;
          } catch (err) {
            console.error(`❌ Backfill [${c.id}].${field}:`, err.message);
            summary.failed++;
          }
        }
      }
    }

    if (dirty) {
      try {
        await c.update(updates);
        summary.updated++;
        console.log(`✅ Backfilled case ${c.id}`);
      } catch (err) {
        console.error(`❌ Failed to save backfill for case ${c.id}:`, err.message);
        summary.failed++;
      }
    } else {
      summary.skipped++;
    }
  }

  console.log("📊 Backfill complete:", summary);
  return summary;
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  updateCase,
  updateCaseStatus,
  deleteCase,
  backfillTranslations,
};