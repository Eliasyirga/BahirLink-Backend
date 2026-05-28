const FinalReport = require("../models/FinalReport");
const Emergency = require("../models/Emergency");
const ResponderTeam = require("../models/ResponderTeam");

const ensureArray = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      // If it's a simple string, return it as a single-item array
      return [value].filter(Boolean);
    }
  }
  return [];
};

const createFinalReport = async (
  emergencyId,
  payload = {},
  responderId = null,
  files = [], // Added files parameter here (passed from req.files in the handler)
) => {
  try {
    // 1. Check if a report already exists for this emergency
    let report = await FinalReport.findOne({ where: { emergencyId } });

    // 2. Fetch the associated emergency
    const emergency = await Emergency.findByPk(emergencyId);
    if (!emergency) throw new Error("Emergency not found");

    const reporterType = emergency.userId ? "user" : "guest";

    // 3. Take a snapshot of the location for the report
    const locationSnapshot = {
      kebele: emergency.kebele,
      subdivision: emergency.subdivision,
      street: emergency.street,
      lat: emergency.latitude,
      lng: emergency.longitude,
    };

    // --- CLOUDINARY MULTI-FILE HANDLING ---
    // Extract payload media if any exist from a text array fallback
    let finalMediaArray = ensureArray(payload.media);

    // If new files were uploaded via Multer, map their Cloudinary URLs and push them in
    if (files && files.length > 0) {
      const uploadedUrls = files.map((file) => file.path); // file.path holds the dynamic cloud HTTPS link
      finalMediaArray = [...finalMediaArray, ...uploadedUrls];
    }

    // 4. Construct the report data
    const reportData = {
      emergencyId: emergency.id,
      reporterType,
      userId: emergency.userId || null,
      deviceId: emergency.deviceId || null,
      responderId: responderId || emergency.responderId || null,
      location: locationSnapshot,
      incidentSummary: payload.incidentSummary || emergency.description || "",
      injuredCount: parseInt(payload.injuredCount) || 0,
      deceasedCount: parseInt(payload.deceasedCount) || 0,

      media: finalMediaArray, // Stores the cloud asset URL array cleanly

      // ✅ FIX: Use ensureArray to parse stringified JSON from FormData
      witnesses: ensureArray(payload.witnesses),
      suspects: ensureArray(payload.suspects),

      propertyDamage: payload.propertyDamage || null,
      propertyDamageValue: parseFloat(payload.propertyDamageValue) || 0,
      status: "resolved",
    };

    if (report) {
      // ✅ UPDATE existing report
      await report.update(reportData);
    } else {
      // ✅ CREATE new report
      report = await FinalReport.create(reportData);
    }

    // 5. Update the original emergency status to resolved
    await emergency.update({
      status: "resolved",
      resolvedAt: new Date(),
    });

    return report;
  } catch (err) {
    console.error("❌ Create/Update FinalReport Error:", err.message);
    throw err;
  }
};

const updateFinalReport = async (emergencyId, payload, files = []) => {
  try {
    const report = await FinalReport.findOne({ where: { emergencyId } });
    if (!report) throw new Error("Final report not found");

    // Prevent updates if the admin has already locked/verified the report
    if (report.status === "verified") {
      throw new Error("Cannot update a verified report");
    }

    // --- CLOUDINARY UPDATE HANDLING ---
    // Start with whatever media already exists on the report, or fallback to payload configuration
    let currentMedia = ensureArray(payload.media ?? report.media);

    // Append new images/videos if the responder uploads extra material during revision
    if (files && files.length > 0) {
      const newUrls = files.map((file) => file.path);
      currentMedia = [...currentMedia, ...newUrls];
    }

    await report.update({
      incidentSummary: payload.incidentSummary ?? report.incidentSummary,
      injuredCount: payload.injuredCount ?? report.injuredCount,
      deceasedCount: payload.deceasedCount ?? report.deceasedCount,

      media: currentMedia, // Update with the newly calculated collection string/array

      witnesses: payload.witnesses ?? report.witnesses,
      suspects: payload.suspects ?? report.suspects,
      propertyDamage: payload.propertyDamage ?? report.propertyDamage,
      propertyDamageValue:
        payload.propertyDamageValue ?? report.propertyDamageValue,
    });

    return report;
  } catch (err) {
    console.error("❌ Update FinalReport Error:", err.message);
    throw err;
  }
};

const verifyFinalReport = async (emergencyId, adminId) => {
  try {
    const report = await FinalReport.findOne({ where: { emergencyId } });
    if (!report) throw new Error("Final report not found");

    await report.update({
      status: "verified",
      verifiedBy: adminId || null,
      verifiedAt: new Date(),
    });

    return report;
  } catch (err) {
    console.error("❌ Verify Error:", err.message);
    throw err;
  }
};

/**
 * ✅ ARCHIVE FINAL REPORT
 */
const archiveFinalReport = async (emergencyId) => {
  try {
    const report = await FinalReport.findOne({ where: { emergencyId } });
    if (!report) throw new Error("Final report not found");

    await report.update({ status: "archived" });

    return report;
  } catch (err) {
    console.error("❌ Archive Error:", err.message);
    throw err;
  }
};

/**
 * ✅ DATA RETRIEVAL METHODS
 */
const getFinalReportByEmergency = async (emergencyId) => {
  return await FinalReport.findOne({
    where: { emergencyId },
    include: [
      {
        model: ResponderTeam,
        as: "responder",
        attributes: ["name", "phone", "email"],
      },
      {
        model: Emergency,
        as: "emergency", // Ensure this alias exists in your index.js
        include: ["emergencyType", "kebele"], // Pull the category and location name
      },
    ],
  });
};

const getAllFinalReports = async () => {
  return await FinalReport.findAll({
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createFinalReport,
  updateFinalReport,
  verifyFinalReport,
  archiveFinalReport,
  getFinalReportByEmergency,
  getAllFinalReports,
};
