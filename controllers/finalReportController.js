const finalReportService = require("../services/finalReportService");
const PDFDocument = require("pdfkit");

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

const downloadPDFReport = async (req, res) => {
  try {
    const { emergencyId } = req.params;
    const report =
      await finalReportService.getFinalReportByEmergency(emergencyId);

    if (!report) {
      return res
        .status(404)
        .json({ success: false, message: "Report not found" });
    }

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Report_${emergencyId}.pdf`,
    );
    doc.pipe(res);

    // --- EN-ONLY SANITIZER FUNCTION ---
    const getEnglishLang = (val) => {
      if (!val) return "—";

      // Handle standard objects
      if (typeof val === "object") {
        return val.en || val.name?.en || val.label?.en || val.name || "—";
      }

      // Handle unparsed database JSON strings
      if (
        typeof val === "string" &&
        (val.includes('{"en":') || val.includes('{"am":'))
      ) {
        try {
          const parsed = JSON.parse(val);
          return parsed.en || "—";
        } catch (e) {
          return val;
        }
      }

      // Filter out garbage test fields/placeholders
      const strVal = String(val).trim();
      if (/qwerty/i.test(strVal) || strVal.toLowerCase() === "v") {
        return "—";
      }

      return strVal;
    };

    const W = 512; // Usable content width
    const blue = "#1D4ED8";
    const dark = "#0F172A";
    const gray = "#64748B";
    const light = "#F1F5F9";

    // ── HEADER ──────────────────────────────────────────────
    doc.rect(0, 0, 612, 95).fill("#0F172A");
    doc
      .fillColor("#ffffff")
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("BAHIRLINK", 50, 24, { characterSpacing: 2 });
    doc
      .fontSize(10)
      .font("Helvetica")
      .text("OFFICIAL INCIDENT REPORT", 50, 48, { characterSpacing: 1.5 });
    doc
      .fontSize(9)
      .fillColor("#94A3B8")
      .text(
        `Report ID: ${String(emergencyId).slice(-10).toUpperCase()}   |   Generated: ${new Date().toLocaleString("en-US")}`,
        50,
        66,
      );

    // Manually push document pointer below the dark header block banner
    doc.y = 120;

    // ── STATUS BADGE ─────────────────────────────────────────
    doc.roundedRect(50, doc.y, 100, 22, 4).fill("#DCFCE7");
    doc
      .fillColor("#16A34A")
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("● RESOLVED", 58, doc.y + 6);

    // Step forward past structural elements
    doc.y += 32;

    // ── SECTION HELPER (Safe Y positioning layout tracking) ──
    const section = (title) => {
      doc.moveDown(1.2);
      // Fill layout block element
      doc.rect(50, doc.y, W, 24).fill(blue);
      doc
        .fillColor("#ffffff")
        .fontSize(10)
        .font("Helvetica-Bold")
        .text(title.toUpperCase(), 58, doc.y + 7);

      // Update tracking state coordinate explicitly
      doc.y += 30;
      doc.fillColor(dark).font("Helvetica").fontSize(11);
    };

    const row = (label, value) => {
      const displayVal = getEnglishLang(value);
      if (!displayVal || displayVal === "—") return;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor(gray)
        .text(label.toUpperCase(), { continued: false });

      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor(dark)
        .text(displayVal, { indent: 10 })
        .moveDown(0.4);
    };

    const divider = () => {
      doc.rect(50, doc.y, W, 0.5).fill("#E2E8F0");
      doc.y += 8;
    };

    // ── I. INCIDENT DETAILS ──────────────────────────────────
    section("I. Incident Details");
    row("Incident Type", report.emergency?.emergencyType?.name);
    divider();
    row("Kebele", report.emergency?.kebele?.name);
    divider();
    row("Subdivision", report.emergency?.subdivision);
    divider();
    row(
      "Specific Location",
      report.emergency?.specificLocation || report.emergency?.address,
    );
    divider();
    row(
      "Reported At",
      report.emergency?.createdAt
        ? new Date(report.emergency.createdAt).toLocaleString("en-US")
        : null,
    );
    divider();
    row(
      "Resolved At",
      report.emergency?.resolvedAt
        ? new Date(report.emergency.resolvedAt).toLocaleString("en-US")
        : null,
    );

    // ── II. CALLER NARRATIVE ─────────────────────────────────
    const narrativeText = getEnglishLang(report.emergency?.description);
    if (narrativeText && narrativeText !== "—") {
      section("II. Original Caller Narrative");

      const startY = doc.y;
      // Write the description paragraph first to measure text layout height safely
      doc
        .fillColor(gray)
        .fontSize(11)
        .font("Helvetica-Oblique")
        .text(`"${narrativeText}"`, 65, startY + 5, {
          width: W - 20,
          align: "justify",
          lineGap: 4,
        });

      const endY = doc.y;
      const textBlockHeight = endY - startY + 10;

      // Draw safe structural column accent line exactly tracking the length of text block height
      doc.rect(50, startY, 3, textBlockHeight).fill(blue);
      doc.y = endY + 15;
    }

    // ── III. RESOLUTION SUMMARY ──────────────────────────────
    section("III. Resolution Summary");
    doc
      .font("Helvetica")
      .fontSize(11)
      .fillColor(dark)
      .text(getEnglishLang(report.incidentSummary) || "No summary provided.", {
        width: W,
        align: "justify",
        lineGap: 4,
      });
    doc.moveDown(1.5);

    // Stats Grid Metrics Calculation
    const stats = [
      { label: "Injured", value: report.injuredCount ?? 0, color: "#F59E0B" },
      { label: "Deceased", value: report.deceasedCount ?? 3, color: "#EF4444" },
      {
        label: "Property Damage",
        value: getEnglishLang(report.propertyDamage) || "None",
        color: blue,
      },
      {
        label: "Estimated Value",
        value: `${(report.propertyDamageValue || 0).toLocaleString()} ETB`,
        color: "#10B981",
      },
    ];

    const colW = W / 2 - 6;
    let sx = 50,
      sy = doc.y;

    stats.forEach((s, i) => {
      // Draw backdrop box element background
      doc.rect(sx, sy, colW, 52).fill(light);

      // Draw descriptive text labels matching color values
      doc
        .fillColor(s.color)
        .fontSize(9)
        .font("Helvetica-Bold")
        .text(s.label.toUpperCase(), sx + 12, sy + 10, { width: colW - 24 });
      doc
        .fillColor(dark)
        .fontSize(15)
        .font("Helvetica-Bold")
        .text(String(s.value), sx + 12, sy + 24, { width: colW - 24 });

      // Shift structural drawing axis safely
      sx += colW + 12;
      if (i % 2 === 1) {
        sx = 50;
        sy += 62;
      }
    });

    // Explicitly lock tracking layout pointer past complete grid boundaries
    doc.y = sy + 15;

    // ── IV. INVESTIGATION ────────────────────────────────────
    section("IV. Investigation Details");

    doc.font("Helvetica-Bold").fontSize(10).fillColor(gray).text("WITNESSES");
    doc.moveDown(0.3);

    const rawWitnesses = Array.isArray(report.witnesses)
      ? report.witnesses
      : [];
    const witnesses = rawWitnesses
      .map(getEnglishLang)
      .filter((w) => w && w !== "—");

    if (witnesses.length) {
      witnesses.forEach((w) => {
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor(dark)
          .text(`• ${w}`, { indent: 10 })
          .moveDown(0.2);
      });
    } else {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#94A3B8")
        .text("None recorded", { indent: 10 })
        .moveDown(0.2);
    }
    doc.moveDown(0.5);

    doc.font("Helvetica-Bold").fontSize(10).fillColor(gray).text("SUSPECTS");
    doc.moveDown(0.3);

    const rawSuspects = Array.isArray(report.suspects) ? report.suspects : [];
    const suspects = rawSuspects
      .map(getEnglishLang)
      .filter((s) => s && s !== "—");

    if (suspects.length) {
      suspects.forEach((s) => {
        doc
          .font("Helvetica")
          .fontSize(11)
          .fillColor(dark)
          .text(`• ${s}`, { indent: 10 })
          .moveDown(0.2);
      });
    } else {
      doc
        .font("Helvetica")
        .fontSize(11)
        .fillColor("#94A3B8")
        .text("None recorded", { indent: 10 });
    }

    // ── V. AUTHORIZATION ─────────────────────────────────────
    section("V. Authorization");
    row("Responding Team", report.responder?.name);
    divider();
    row("Team Contact", report.responder?.phone);
    divider();
    row("Team Email", report.responder?.email);
    divider();
    row(
      "Report Finalized",
      report.createdAt
        ? new Date(report.createdAt).toLocaleString("en-US")
        : null,
    );

    doc.moveDown(2);
    doc.rect(50, doc.y, W, 0.5).fill("#E2E8F0");
    doc.moveDown(0.8);
    doc
      .fontSize(8)
      .fillColor("#94A3B8")
      .font("Helvetica")
      .text(
        "This is an official document generated by BahirLink Emergency Management System. Unauthorized reproduction is prohibited.",
        50,
        doc.y,
        { width: W, align: "center" },
      );

    doc.end();
  } catch (err) {
    console.error("❌ PDF Error:", err.message);
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
