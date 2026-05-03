const finalReportService = require("../services/finalReportService");
const PDFDocument = require("pdfkit");

/**
 * Helper to extract arrays from req.body regardless of format.
 * Handles: JSON strings, "field[]" notation, and standard arrays.
 */
const extractArray = (body, key) => {
  const value = body[key] || body[`${key}[]`];

  if (!value) return [];

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [value];
    } catch (e) {
      return [value];
    }
  }

  return [].concat(value);
};

/**
 * CREATE FINAL REPORT
 */
const createFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const responderId = req.user?.id || null;

    const payload = {
      ...req.body,
      injuredCount: parseInt(req.body.injuredCount) || 0,
      deceasedCount: parseInt(req.body.deceasedCount) || 0,
      propertyDamageValue: parseFloat(req.body.propertyDamageValue) || 0,

      witnesses: extractArray(req.body, "witnesses"),
      suspects: extractArray(req.body, "suspects"),

      media: req.files ? req.files.map((file) => file.path) : [],
      propertyDamage: req.body.propertyDamage || "",
      incidentSummary: req.body.incidentSummary || "",
    };

    const report = await finalReportService.createFinalReport(
      emergencyId,
      payload,
      responderId,
    );

    return res.status(201).json({
      success: true,
      message: "Final report created and emergency resolved successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Create Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * UPDATE FINAL REPORT
 */
const updateFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const payload = { ...req.body };

    if (payload.injuredCount !== undefined)
      payload.injuredCount = parseInt(payload.injuredCount) || 0;
    if (payload.deceasedCount !== undefined)
      payload.deceasedCount = parseInt(payload.deceasedCount) || 0;
    if (payload.propertyDamageValue !== undefined)
      payload.propertyDamageValue =
        parseFloat(payload.propertyDamageValue) || 0;

    if (req.body.witnesses || req.body["witnesses[]"]) {
      payload.witnesses = extractArray(req.body, "witnesses");
    }
    if (req.body.suspects || req.body["suspects[]"]) {
      payload.suspects = extractArray(req.body, "suspects");
    }

    if (req.files && req.files.length > 0) {
      payload.media = req.files.map((file) => file.path);
    }

    const report = await finalReportService.updateFinalReport(
      emergencyId,
      payload,
    );

    return res.status(200).json({
      success: true,
      message: "Final report updated successfully",
      data: report,
    });
  } catch (err) {
    console.error("❌ Controller Update Error:", err.message);
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GENERATE PDF REPORT
 */
/**
 * GENERATE FULL PDF DOSSIER
 */
const downloadPDFReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;

    // This call now includes the 'emergency' and 'responder' associations
    // because we updated the Service/Model logic earlier.
    const report =
      await finalReportService.getFinalReportByEmergency(emergencyId);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report data not found" });
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Official_Report_${emergencyId}.pdf`,
    );

    doc.pipe(res);

    // --- 1. HEADER SECTION ---
    doc.rect(0, 0, 612, 80).fill("#1e293b"); // Dark slate header background
    doc
      .fillColor("#ffffff")
      .fontSize(22)
      .text("BAHIRLINK INCIDENT REPORT", 50, 30, { characterSpacing: 1 });
    doc
      .fontSize(10)
      .text("OFFICIAL GOVERNMENT RECORD", 50, 55, { characterSpacing: 2 });
    doc.moveDown(4);

    // --- 2. EMERGENCY CONTEXT (Original Data) ---
    doc
      .fillColor("#2563eb")
      .fontSize(14)
      .text("I. INITIAL INCIDENT DATA", { underline: true });
    doc.fillColor("#000000").fontSize(11).moveDown(0.5);

    // Pulling from the associated Emergency model
    doc.text(
      `Incident Type: ${report.emergency?.emergencyType?.name || "Standard Emergency"}`,
    );
    doc.text(`Kebele: ${report.emergency?.kebele?.name || "N/A"}`);
    doc.text(`Subdivision: ${report.emergency?.subdivision || "N/A"}`);
    doc.text(
      `Reported At: ${new Date(report.emergency?.createdAt).toLocaleString()}`,
    );
    doc.moveDown(0.5);
    doc.text("Original Caller Narrative:", { oblique: true });
    doc.text(`"${report.emergency?.description || "No narrative provided"}"`, {
      indent: 20,
      align: "justify",
    });
    doc.moveDown();

    // --- 3. RESOLUTION DATA (Manual Attributes) ---
    doc
      .fillColor("#2563eb")
      .fontSize(14)
      .text("II. RESOLUTION SUMMARY", { underline: true });
    doc.fillColor("#000000").fontSize(11).moveDown(0.5);
    doc.text(report.incidentSummary || "No summary provided.", {
      align: "justify",
    });
    doc.moveDown();

    // Stats Table-like layout
    doc.text(`Injured Count: ${report.injuredCount}`, { bulletRadius: 2 });
    doc.text(`Deceased Count: ${report.deceasedCount}`);
    doc.text(`Property Damage: ${report.propertyDamage || "None"}`);
    doc.text(
      `Estimated Value: ${report.propertyDamageValue.toLocaleString()} ETB`,
    );
    doc.moveDown();

    // --- 4. PERSONNEL & INVESTIGATION ---
    doc
      .fillColor("#2563eb")
      .fontSize(14)
      .text("III. INVESTIGATION DETAILS", { underline: true });
    doc.fillColor("#000000").fontSize(11).moveDown(0.5);

    doc.text("Witnesses:", { bold: true });
    if (report.witnesses?.length) {
      report.witnesses.forEach((w, i) => doc.text(`  - ${w}`));
    } else {
      doc.text("  - None recorded", { color: "#666666" });
    }

    doc.moveDown(0.5);
    doc.text("Suspects:", { bold: true });
    if (report.suspects?.length) {
      report.suspects.forEach((s, i) => doc.text(`  - ${s}`));
    } else {
      doc.text("  - None recorded", { color: "#666666" });
    }
    doc.moveDown();

    // --- 5. AUTHORIZATION ---
    doc.moveDown(2);
    doc.rect(50, doc.y, 500, 1).stroke(); // Line
    doc.moveDown(1);
    doc.fontSize(12).text("AUTHORIZATION SIGN-OFF", { bold: true });
    doc.fontSize(10);
    doc.text(`Responding Team: ${report.responder?.name || "System Assigned"}`);
    doc.text(`Team Contact: ${report.responder?.phone || "N/A"}`);
    doc.text(`Finalized Date: ${new Date(report.createdAt).toLocaleString()}`);

    doc.end();
  } catch (err) {
    console.error("❌ PDF Controller Error:", err.message);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: "Error generating PDF" });
    }
  }
};

/**
 * ARCHIVE & VERIFICATION
 */
const verifyFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const adminId = req.user?.id;
    const report = await finalReportService.verifyFinalReport(
      emergencyId,
      adminId,
    );
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const archiveFinalReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const report = await finalReportService.archiveFinalReport(emergencyId);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const getReportByEmergency = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const report =
      await finalReportService.getFinalReportByEmergency(emergencyId);
    res.json({ success: true, data: report });
  } catch (err) {
    res.status(404).json({ success: false, message: err.message });
  }
};

const getAllReports = async (req, res) => {
  try {
    const reports = await finalReportService.getAllFinalReports();
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  createFinalReport,
  updateFinalReport,
  downloadPDFReport,
  verifyFinalReport,
  archiveFinalReport,
  getReportByEmergency,
  getAllReports,
};
