const { Cases, CaseType, Agency, ResponderTeam, Kebele } = require("../models");
const translate = require("google-translate-api-x");

const autoTranslate = async (fieldData) => {
  if (fieldData === null || fieldData === undefined) return null;

  let data =
    typeof fieldData === "string" ? { _raw: fieldData } : { ...fieldData };

  if (data._raw) {
    const rawText = data._raw;
    delete data._raw;

    try {
      const toEn = await translate(rawText, { to: "en" });
      const detectedLang = toEn.from?.language?.iso || "en";

      if (detectedLang === "am") {
        data.am = rawText;
        data.en = toEn.text;
      } else {
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
      try {
        value = JSON.parse(value);
      } catch (_) {}
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
      try {
        ctName = JSON.parse(ctName);
      } catch (_) {}
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
  { model: Agency, as: "agency", attributes: ["id", "name"] },
  { model: CaseType, as: "caseType", attributes: ["id", "name"] },
  { model: ResponderTeam, as: "responderTeam", attributes: ["id", "name"] },
  { model: Kebele, as: "lastSeenLocation", attributes: ["id", "name"] },
];

// ─── GET ALL ──────────────────────────────────────────────────────────────────
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

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getCaseById = async (id, lang = "en") => {
  const singleCase = await Cases.findByPk(id, { include: caseIncludes });
  if (!singleCase) throw new Error("Case record not found.");
  return localize(singleCase, lang, multiLangFields);
};

const createCase = async (data, file) => {
  // Added file parameter
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

  const [translatedName, translatedDesc, translatedFeatures] =
    await Promise.all([
      autoTranslate(fullName || "Unknown Case"),
      autoTranslate(description || ""),
      autoTranslate(distinctiveFeatures || ""),
    ]);

  // Extract Cloudinary dynamic links safely if a file is present
  let mediaUrl = null;
  let mediaPublicId = null;
  if (file) {
    mediaUrl = file.path;
    mediaPublicId = file.filename;
  }

  const newCase = await Cases.create({
    ...rest,
    fullName: translatedName,
    description: translatedDesc,
    distinctiveFeatures: translatedFeatures,
    mediaUrl, // Saved as clean cloud link string
    mediaPublicId, // Saved for asset mutations/deletion tracking

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

const updateCase = async (id, updates, file) => {
  // Added file parameter
  const singleCase = await Cases.findByPk(id);
  if (!singleCase) throw new Error("Case not found.");

  const finalUpdates = { ...updates };

  for (const field of multiLangFields) {
    if (!finalUpdates[field]) continue;

    const incoming = finalUpdates[field];

    const amMissing =
      typeof incoming === "string" ||
      (typeof incoming === "object" &&
        incoming.en &&
        (!incoming.am || incoming.am.toString().trim() === ""));

    if (amMissing) {
      finalUpdates[field] = await autoTranslate(
        typeof incoming === "string" ? incoming : incoming.en,
      );
    } else {
      finalUpdates[field] = { ...singleCase[field], ...incoming };
    }
  }

  if (file) {
    finalUpdates.mediaUrl = file.path;
    finalUpdates.mediaPublicId = file.filename;
  }

  await singleCase.update(finalUpdates);
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
        try {
          value = JSON.parse(value);
        } catch (_) {}
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
        console.error(
          `❌ Failed to save backfill for case ${c.id}:`,
          err.message,
        );
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
