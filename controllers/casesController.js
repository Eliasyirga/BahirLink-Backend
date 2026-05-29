const casesService = require("../services/casesService");

const parseLang = (req, defaultLang = "en") => {
  if (req.query.lang) return req.query.lang;

  const header = (req.headers["accept-language"] || "")
    .split(/[,;]/)[0]
    .trim()
    .toLowerCase();

  if (header === "am" || header.startsWith("am-")) return "am";
  return defaultLang;
};

const parseLocalized = (field) => {
  if (field === null || field === undefined) return field;
  try {
    const parsed = typeof field === "string" ? JSON.parse(field) : field;
    if (parsed && typeof parsed === "object") {
      return parsed.en || parsed.am || field;
    }
    return parsed;
  } catch (_) {
    return field;
  }
};

// // ─── CREATE ───────────────────────────────────────────────────────────────────
// const createCase = async (req, res) => {
//   try {
//     const { fullName, caseTypeId, responderTeamId } = req.body;

//     if (!fullName || !caseTypeId || !responderTeamId) {
//       return res.status(400).json({
//         success: false,
//         message: "Full Name, Case Type, and Responder Team are required.",
//       });
//     }

//     const caseData = {
//       // Always normalise to a plain string so autoTranslate detects language
//       // and produces a complete { en, am } object for every new case.
//       fullName:            parseLocalized(req.body.fullName),
//       description:         parseLocalized(req.body.description),
//       distinctiveFeatures: parseLocalized(req.body.distinctiveFeatures),

//       gender:             req.body.gender             || null,
//       priority:           req.body.priority           || "medium",
//       lastSeenDate:       req.body.lastSeenDate       || null,
//       contactInfo:        req.body.contactInfo        || null,
//       isDangerous:
//         req.body.isDangerous === "true" || req.body.isDangerous === true,
//       age:    req.body.age    ? parseInt(req.body.age, 10)    : null,
//       height: req.body.height ? parseInt(req.body.height, 10) : null,
//       weight: req.body.weight ? parseInt(req.body.weight, 10) : null,
//       reward: req.body.reward ? parseFloat(req.body.reward)   : 0,

//       caseTypeId:         parseInt(caseTypeId, 10),
//       responderTeamId:    parseInt(responderTeamId, 10),
//       lastSeenLocationId: req.body.lastSeenLocationId
//         ? parseInt(req.body.lastSeenLocationId, 10)
//         : null,

//       mediaUrl:  req.file ? `/uploads/${req.file.filename}` : null,
//       mediaType: req.file ? "photo"                         : null,
//     };

//     const newCase = await casesService.createCase(caseData);

//     return res.status(201).json({
//       success: true,
//       message: "Case registered successfully",
//       data: newCase,
//     });
//   } catch (error) {
//     console.error("❌ Controller Error [createCase]:", error);
//     return res.status(400).json({
//       success: false,
//       message: error.message || "Failed to register case.",
//     });
//   }
// };

const createCase = async (req, res) => {
  try {
    const { fullName, caseTypeId, responderTeamId } = req.body;

    // 1. Initial structural payload validation guard
    if (!fullName || !caseTypeId || !responderTeamId) {
      return res.status(400).json({
        success: false,
        message: "Full Name, Case Type, and Responder Team are required.",
      });
    }

    // 2. Normalize raw body strings before handing off to service translation engine
    // (This guarantees autoTranslate handles a plain string, not an object)
    const formattedData = {
      ...req.body,
      fullName: parseLocalized(req.body.fullName),
      description: parseLocalized(req.body.description),
      distinctiveFeatures: parseLocalized(req.body.distinctiveFeatures),
    };

    // 3. Forward the parameters and the Cloudinary req.file block cleanly
    const newCase = await casesService.createCase(formattedData, req.file);

    return res.status(201).json({
      success: true,
      message: "Case registered successfully",
      data: newCase,
    });
  } catch (error) {
    console.error("❌ Controller Error [createCase]:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Failed to register case.",
    });
  }
};

// ─── GET ALL ──────────────────────────────────────────────────────────────────
const getAllCases = async (req, res) => {
  try {
    const lang = parseLang(req);
    const cases = await casesService.getAllCases(lang);
    return res
      .status(200)
      .json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    console.error("❌ Controller Error [getAllCases]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET BY ID ────────────────────────────────────────────────────────────────
const getCaseById = async (req, res) => {
  try {
    const lang = parseLang(req, "all");
    const caseData = await casesService.getCaseById(req.params.id, lang);
    return res.status(200).json({ success: true, data: caseData });
  } catch (error) {
    console.error("❌ Controller Error [getCaseById]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─── UPDATE STATUS ────────────────────────────────────────────────────────────
const updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res
        .status(400)
        .json({ success: false, message: "Status is required." });
    }
    const result = await casesService.updateCaseStatus(req.params.id, status);
    return res
      .status(200)
      .json({
        success: true,
        message: "Status updated successfully",
        data: result,
      });
  } catch (error) {
    console.error("❌ Controller Error [updateCaseStatus]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── GET BY RESPONDER TEAM ────────────────────────────────────────────────────
const getCasesByResponderTeam = async (req, res) => {
  try {
    const { responderTeamId } = req.params;
    const lang = parseLang(req);

    const cases =
      responderTeamId === "all"
        ? await casesService.getAllCases(lang)
        : await casesService.getCasesByResponderTeam(
            parseInt(responderTeamId, 10),
            lang,
          );

    return res
      .status(200)
      .json({ success: true, count: cases.length, data: cases });
  } catch (error) {
    console.error("❌ Controller Error [getCasesByResponderTeam]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── DELETE ───────────────────────────────────────────────────────────────────
const deleteCase = async (req, res) => {
  try {
    const result = await casesService.deleteCase(req.params.id);
    return res.status(200).json(result);
  } catch (error) {
    console.error("❌ Controller Error [deleteCase]:", error);
    return res.status(404).json({ success: false, message: error.message });
  }
};

// ─── BACKFILL TRANSLATIONS ────────────────────────────────────────────────────
// One-off admin endpoint to retroactively translate existing cases that were
// stored before auto-translation was added.
// Protect this route with an admin auth middleware in your router.
//
// POST /api/cases/backfill-translations
const backfillTranslations = async (req, res) => {
  try {
    console.log("🔄 Starting translation backfill for all cases...");
    const summary = await casesService.backfillTranslations();
    return res.status(200).json({ success: true, summary });
  } catch (error) {
    console.error("❌ Controller Error [backfillTranslations]:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam,
  updateCaseStatus,
  deleteCase,
  backfillTranslations,
};
