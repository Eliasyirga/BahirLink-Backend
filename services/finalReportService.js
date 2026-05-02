const FinalReport = require("../models/FinalReport");
const Emergency = require("../models/Emergency");

/**
 * ✅ CREATE FINAL REPORT & UPDATE EMERGENCY STATUS
 * This function handles the logic for closing an emergency.
 */
const createFinalReport = async (
  emergencyId,
  payload = {},
  responderId = null,
) => {
  try {
    // 1. Avoid duplicate reports
    const existing = await FinalReport.findOne({ where: { emergencyId } });
    if (existing) {
      throw new Error("Final report already exists for this emergency");
    }

    // 2. Fetch original Emergency data
    const emergency = await Emergency.findByPk(emergencyId);
    if (!emergency) {
      throw new Error("Emergency not found");
    }

    // 3. Automated Logic: Determine if reporter was a User or Guest
    const reporterType = emergency.userId ? "user" : "guest";

    // 4. Capture a Location Snapshot (in case coordinates change later)
    const locationSnapshot = {
      kebele: emergency.kebele,
      subdivision: emergency.subdivision,
      street: emergency.street,
      lat: emergency.latitude,
      lng: emergency.longitude,
    };

    // 5. Build and Save the Report
    const report = await FinalReport.create({
      emergencyId: emergency.id,
      reporterType,
      userId: emergency.userId || null,
      deviceId: emergency.deviceId || null,
      responderId: responderId || emergency.responderId || null,
      location: locationSnapshot,
      // Priority: Payload (UI) > Emergency Description > Empty String
      incidentSummary: payload.incidentSummary || emergency.description || "",
      injuredCount: payload.injuredCount || 0,
      deceasedCount: payload.deceasedCount || 0,
      media: payload.media || [],
      status: "resolved",
    });

    // 6. ⚡ AUTOMATIC UPDATE: Mark original emergency as resolved
    await emergency.update({ status: "resolved" });

    return report;
  } catch (err) {
    console.error("❌ Create FinalReport Error:", err.message);
    throw err;
  }
};

/**
 * ✅ UPDATE FINAL REPORT
 * Used to refine counts or summary after the report is already created.
 */
const updateFinalReport = async (emergencyId, payload) => {
  try {
    const report = await FinalReport.findOne({ where: { emergencyId } });
    if (!report) throw new Error("Final report not found");

    await report.update({
      incidentSummary: payload.incidentSummary ?? report.incidentSummary,
      injuredCount: payload.injuredCount ?? report.injuredCount,
      deceasedCount: payload.deceasedCount ?? report.deceasedCount,
      media: payload.media ?? report.media,
    });
    return report;
  } catch (err) {
    console.error("❌ Update FinalReport Error:", err.message);
    throw err;
  }
};

/**
 * ✅ VERIFY FINAL REPORT
 * Admin action to confirm report accuracy.
 */
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
 * Move to historical archives (Status change only).
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
  return await FinalReport.findOne({ where: { emergencyId } });
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
