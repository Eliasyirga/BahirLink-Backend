const {
  createEmergedFromEmergencies,
  getAllEmerged,
  getEmergedById,
  getUnassignedEmergencies,
  updateEmerged,
  deleteEmerged,
} = require("../services/emergedService");

const { Emergency, ResponderTeamKebele } = require("../models");

/**
 * Kebele scope of the caller: responder teams are limited to the kebeles they
 * cover; admins/agencies are unrestricted (null).
 */
const callerKebeleIds = async (user) => {
  if (user?.type !== "responder") return null;
  const rows = await ResponderTeamKebele.findAll({
    where: { responderTeamId: user.id },
    attributes: ["kebeleId"],
  });
  return rows.map((r) => Number(r.kebeleId));
};

// ===============================
// 🔗 MERGE EMERGENCIES
// ===============================
const mergeEmergencies = async (req, res) => {
  try {
    const { mainId, mergeIds } = req.body;

    if (!mainId) {
      return res.status(400).json({
        success: false,
        message: "mainId is required",
      });
    }

    const safeMergeIds = Array.isArray(mergeIds) ? mergeIds : [];

    // 🔥 FETCH MAIN EMERGENCY (FIXED ERROR)
    const mainEmergency = await Emergency.findByPk(mainId);

    if (!mainEmergency) {
      return res.status(404).json({
        success: false,
        message: "Main emergency not found",
      });
    }

    // 🔥 USE KEBELE FROM EMERGENCY (CORRECT DESIGN)
    const kebeleId = mainEmergency.kebeleId;

    const scope = await callerKebeleIds(req.user);
    if (scope && !scope.includes(Number(kebeleId))) {
      return res.status(403).json({
        success: false,
        message: "Not allowed outside assigned kebele",
      });
    }

    const result = await createEmergedFromEmergencies(
      mainId,
      safeMergeIds,
      kebeleId,
    );

    return res.status(201).json({
      success: true,
      message: "Emergencies grouped successfully",
      data: result,
    });
  } catch (err) {
    console.error("MERGE ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// 📥 GET GROUPED
// ===============================
const getEmergedHandler = async (req, res) => {
  try {
    const data = await getAllEmerged(); // 🔥 no kebeleId

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("GET EMERGED ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch grouped emergencies",
    });
  }
};
// ===============================
// 🔎 GET ONE GROUP (same shape as list items)
// ===============================
const getEmergedByIdHandler = async (req, res) => {
  try {
    const data = await getEmergedById(req.params.id);
    if (!data) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }
    return res.status(200).json({ success: true, data });
  } catch (err) {
    console.error("GET EMERGED BY ID ERROR:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch grouped emergency",
    });
  }
};

// ===============================
// 🟡 GET UNASSIGNED  (?kebeleId=… ; responders default to their first kebele)
// ===============================
const getUnassignedHandler = async (req, res) => {
  try {
    const scope = await callerKebeleIds(req.user);
    let kebeleId = req.query.kebeleId ? Number(req.query.kebeleId) : null;
    if (!kebeleId && scope && scope.length) kebeleId = scope[0];

    if (!kebeleId) {
      return res.status(400).json({
        success: false,
        message: "kebeleId is required",
      });
    }
    if (scope && !scope.includes(kebeleId)) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    const data = await getUnassignedEmergencies(kebeleId);

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("GET UNASSIGNED ERROR:", err);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch unassigned emergencies",
    });
  }
};

// ===============================
// ✏️ UPDATE GROUP
// ===============================
const updateEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Group id is required",
      });
    }

    const scope = await callerKebeleIds(req.user);
    const updated = await updateEmerged(id, req.body, scope);

    return res.status(200).json({
      success: true,
      message: "Group updated successfully",
      data: updated,
    });
  } catch (err) {
    console.error("UPDATE EMERGED ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// 🗑️ DELETE GROUP
// ===============================
const deleteEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Group id is required",
      });
    }

    const scope = await callerKebeleIds(req.user);
    const result = await deleteEmerged(id, scope);

    return res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    console.error("DELETE EMERGED ERROR:", err);

    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
module.exports = {
  mergeEmergencies,
  getEmergedHandler,
  getEmergedByIdHandler,
  getUnassignedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
};
