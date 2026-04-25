const {
  createEmergedFromEmergencies,
  getAllEmerged,
  updateEmerged,
  deleteEmerged,
} = require("../services/emergedService");

// ===============================
// 🔥 MERGE EMERGENCIES
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

    const result = await createEmergedFromEmergencies(mainId, mergeIds || []);

    return res.status(201).json({
      success: true,
      message: "Emergencies merged successfully",
      data: result,
    });
  } catch (err) {
    console.error("MERGE ERROR:", err); // 🔥 important for debugging

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// 📥 GET ALL MERGED GROUPS
// ===============================
const getEmergedHandler = async (req, res) => {
  try {
    const data = await getAllEmerged();

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error("GET EMERGED ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

// ===============================
// ✏️ UPDATE MERGED GROUP
// ===============================
const updateEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Merged group id is required",
      });
    }

    const updated = await updateEmerged(id, req.body);

    return res.status(200).json({
      success: true,
      message: "Merged group updated successfully",
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
// 🗑️ DELETE MERGED GROUP
// ===============================
const deleteEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Merged group id is required",
      });
    }

    const result = await deleteEmerged(id);

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
  updateEmergedHandler,
  deleteEmergedHandler,
};
