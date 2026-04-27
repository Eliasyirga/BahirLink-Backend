const { Emergency, Emerged, sequelize } = require("../models");
const { Op } = require("sequelize");

// ===============================
// 🔗 MERGE / CREATE GROUP
// ===============================
const createEmergedFromEmergencies = async (
  mainId,
  mergeIds = [],
  responderKebeleId,
) => {
  const transaction = await sequelize.transaction();

  try {
    // ===============================
    // ✅ normalize IDs (VERY IMPORTANT FIX)
    // ===============================
    const allIds = [...new Set([mainId, ...mergeIds])]
      .map((id) => Number(id))
      .filter((id) => !isNaN(id));

    const mainIdNum = Number(mainId);

    const emergencies = await Emergency.findAll({
      where: { id: { [Op.in]: allIds } },
      transaction,
    });

    if (!emergencies.length) {
      throw new Error("No emergencies found");
    }

    if (emergencies.length !== allIds.length) {
      throw new Error("Some emergencies not found");
    }

    // ===============================
    // ✅ find main emergency safely
    // ===============================
    const main = emergencies.find((e) => Number(e.id) === mainIdNum);

    if (!main) {
      throw new Error("Main emergency not found");
    }

    // ===============================
    // 📍 SAME KEBELE RULE (source: Emergency)
    // ===============================
    const invalidKebele = emergencies.some(
      (e) => Number(e.kebeleId) !== Number(main.kebeleId),
    );

    if (invalidKebele) {
      throw new Error("Cannot merge emergencies from different kebeles");
    }

    // ===============================
    // 🔒 responder restriction (optional but safe)
    // ===============================
    if (
      responderKebeleId !== undefined &&
      Number(main.kebeleId) !== Number(responderKebeleId)
    ) {
      throw new Error("Not allowed to merge outside assigned kebele");
    }

    // ===============================
    // 🔍 check existing groups safely
    // ===============================
    const groupIds = [
      ...new Set(
        emergencies
          .map((e) => e.emergedId)
          .filter(Boolean)
          .map((id) => Number(id)),
      ),
    ];

    if (groupIds.length > 1) {
      throw new Error("Emergencies already belong to different groups");
    }

    let group;

    // ===============================
    // ♻️ reuse or create group
    // ===============================
    if (groupIds[0]) {
      group = await Emerged.findByPk(groupIds[0], { transaction });

      if (!group) {
        throw new Error("Existing group not found");
      }
    } else {
      group = await Emerged.create(
        {
          summary: main.description,
          kebeleId: main.kebeleId,
          subdivision: main.subdivision,
          street: main.street,
          status: "reported",
        },
        { transaction },
      );
    }

    // ===============================
    // 🔗 link emergencies
    // ===============================
    await Emergency.update(
      { emergedId: group.id },
      {
        where: { id: allIds },
        transaction,
      },
    );

    await transaction.commit();
    return group;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ===============================
// 🟢 GET GROUPED EMERGENCIES
// ===============================
const getAllEmerged = async (kebeleId) => {
  if (!kebeleId) throw new Error("kebeleId is required");

  const groups = await Emerged.findAll({
    where: { kebeleId },
    include: [
      {
        model: Emergency,
        as: "emergencies",
        required: false,
        attributes: ["id", "description", "citizenId", "guestId", "createdAt"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return groups.map((g) => {
    const ems = g.emergencies || [];

    return {
      id: g.id,
      summary: g.summary,
      kebeleId: g.kebeleId,
      subdivision: g.subdivision,
      street: g.street,
      status: g.status,

      // ✅ always correct dynamic value
      reportCount: ems.length,

      reporters: [...new Set(ems.map((e) => e.citizenId || e.guestId))],

      descriptions: ems.map((e) => e.description),

      emergencies: ems,
    };
  });
};

// ===============================
// 🟡 GET UNASSIGNED EMERGENCIES
// ===============================
const getUnassignedEmergencies = async (kebeleId) => {
  if (!kebeleId) throw new Error("kebeleId is required");

  return await Emergency.findAll({
    where: {
      emergedId: null,
      kebeleId,
    },
    order: [["createdAt", "DESC"]],
  });
};

// ===============================
// ✏️ UPDATE GROUP
// ===============================
const updateEmerged = async (id, data, kebeleId) => {
  const group = await Emerged.findByPk(id);

  if (!group) {
    throw new Error("Group not found");
  }

  if (kebeleId && Number(group.kebeleId) !== Number(kebeleId)) {
    throw new Error("Not allowed to update this group");
  }

  return await group.update(data);
};

// ===============================
// 🗑️ DELETE GROUP
// ===============================
const deleteEmerged = async (id, kebeleId) => {
  const transaction = await sequelize.transaction();

  try {
    const group = await Emerged.findByPk(id, { transaction });

    if (!group) {
      throw new Error("Group not found");
    }

    if (kebeleId && Number(group.kebeleId) !== Number(kebeleId)) {
      throw new Error("Not allowed to delete this group");
    }

    await Emergency.update(
      { emergedId: null },
      {
        where: { emergedId: id },
        transaction,
      },
    );

    await Emerged.destroy({
      where: { id },
      transaction,
    });

    await transaction.commit();

    return { message: "Group deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ===============================
module.exports = {
  createEmergedFromEmergencies,
  getAllEmerged,
  getUnassignedEmergencies,
  updateEmerged,
  deleteEmerged,
};
