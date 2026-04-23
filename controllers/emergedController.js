const {
  createEmergedFromEmergencies,
  getAllEmerged,
  updateEmerged,
  deleteEmerged,
} = require("../services/emergedService");

/**
 * POST /api/emerged/merge
 * Merge emergencies into one group
 */
const mergeEmergencies = async (req, res) => {
  try {
    const { mainId, mergeIds } = req.body;

    const result = await createEmergedFromEmergencies(mainId, mergeIds);

    res.status(201).json({
      success: true,
      message: "Emergencies merged successfully",
      data: result,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * GET /api/emerged
 * Get all merged groups (ONE ROW VIEW)
 */
const getEmergedHandler = async (req, res) => {
  try {
    const data = await getAllEmerged();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * PUT /api/emerged/:id
 * Update merged group info
 */
const updateEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const updated = await updateEmerged(id, req.body);

    res.status(200).json({
      success: true,
      message: "Merged group updated successfully",
      data: updated,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

/**
 * DELETE /api/emerged/:id
 * Delete merged group and unlink emergencies
 */
const deleteEmergedHandler = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await deleteEmerged(id);

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: err.message,
    });
  }
};

module.exports = {
  mergeEmergencies,
  getEmergedHandler,
  updateEmergedHandler,
  deleteEmergedHandler,
};
