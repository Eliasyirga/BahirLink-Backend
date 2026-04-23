const casesService = require("../services/casesService");
const { Cases, CaseType, Kebele, CaseReport } = require("../models"); // Ensure models are imported correctly

const createCase = async (req, res) => {
  try {
    // 1. Critical Validation
    if (
      !req.body.fullName ||
      !req.body.caseTypeId ||
      !req.body.responderTeamId
    ) {
      return res
        .status(400)
        .json({
          message: "Full Name, Case Type, and Responder Team are required.",
        });
    }

    // 2. Data Transformation (Fixing Numeric/Boolean storage)
    const data = {
      ...req.body,
      // Fix: Convert strings from FormData into numbers or null
      age: req.body.age ? parseInt(req.body.age) : null,
      height: req.body.height ? parseFloat(req.body.height) : null,
      weight: req.body.weight ? parseFloat(req.body.weight) : null,
      reward: req.body.reward ? parseFloat(req.body.reward) : 0.0,

      // Foreign Keys
      caseTypeId: parseInt(req.body.caseTypeId),
      responderTeamId: parseInt(req.body.responderTeamId),
      lastSeenLocationId: req.body.lastSeenLocationId
        ? parseInt(req.body.lastSeenLocationId)
        : null,

      // Boolean fix
      isDangerous:
        req.body.isDangerous === "true" || req.body.isDangerous === true,

      // File handling
      mediaUrl: req.file ? `/uploads/${req.file.filename}` : null,
      mediaType: req.file ? "photo" : null,

      // Date parsing
      lastSeenDate: req.body.lastSeenDate
        ? new Date(req.body.lastSeenDate)
        : null,
    };

    const newCase = await casesService.createCase(data);
    res.status(201).json(newCase);
  } catch (error) {
    console.error("Controller Error:", error);
    res
      .status(400)
      .json({ message: error.message || "Failed to register case." });
  }
};
const getAllCases = async (req, res) => {
  try {
    const cases = await casesService.getAllCases();
    res.status(200).json(cases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCaseById = async (req, res) => {
  try {
    // Using aliases defined in your associations file:
    // Kebele -> lastSeenLocation
    // CaseReport -> reports
    const caseData = await Cases.findByPk(req.params.id, {
      include: [
        { model: CaseType, as: "caseType" },
        { model: Kebele, as: "lastSeenLocation" },
        {
          model: CaseReport,
          as: "reports",
          include: [{ model: Kebele, as: "kebele" }],
        },
      ],
    });

    if (!caseData) return res.status(404).json({ message: "Case not found" });
    res.json(caseData);
  } catch (error) {
    console.error("Fetch Detail Error:", error);
    res.status(500).json({ error: error.message });
  }
};

const updateCaseStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id } = req.params;

    // Direct update via Sequelize
    const [updated] = await Cases.update({ status }, { where: { id } });

    if (updated === 0)
      return res.status(404).json({ message: "Case not found" });
    res.json({ message: "Status updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getCasesByResponderTeam = async (req, res) => {
  try {
    const { responderTeamId } = req.params;

    let cases;
    if (responderTeamId === "all") {
      cases = await casesService.getAllCases();
    } else {
      cases = await casesService.getCasesByResponderTeam(
        parseInt(responderTeamId),
      );
    }

    res.status(200).json(cases);
  } catch (error) {
    console.error("Fetch Team Cases Error:", error);
    res.status(500).json({ message: error.message });
  }
};

const deleteCase = async (req, res) => {
  try {
    const result = await casesService.deleteCase(req.params.id);
    res.status(200).json(result);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

module.exports = {
  createCase,
  getAllCases,
  getCaseById,
  getCasesByResponderTeam,
  updateCaseStatus,
  deleteCase,
};
