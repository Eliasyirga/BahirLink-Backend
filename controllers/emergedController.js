const {
  createEmergedFromEmergencies,
  getAllEmerged,
  getUnassignedEmergencies,
  updateEmerged,
  deleteEmerged,
} = require("../services/emergedService");

// 🔥 ADD THIS (YOU WERE MISSING IT)
const { Emergency } = require("../models");

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
// 🟡 GET UNASSIGNED
// ===============================
const getUnassignedHandler = async (req, res) => {
  try {
    const kebeleId = req.user?.kebeleId;

    if (!kebeleId) {
      return res.status(401).json({
        success: false,
        message: "kebeleId missing",
      });
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

    const kebeleId = req.user?.kebeleId;

    if (!kebeleId) {
      return res.status(401).json({
        success: false,
        message: "kebeleId missing",
      });
    }

    const updated = await updateEmerged(id, req.body, kebeleId);

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

    const kebeleId = req.user?.kebeleId;

    if (!kebeleId) {
      return res.status(401).json({
        success: false,
        message: "kebeleId missing",
      });
    }

    const result = await deleteEmerged(id, kebeleId);

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
  getUnassignedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
};
