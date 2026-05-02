const { Op } = require("sequelize");
const {
  sequelize,
  Emergency,
  Emerged,
  EmergencyType,
  Category,
  Kebele,
  User,
  Guest,
} = require("../models");

// ===============================
// 🔗 MERGE EMERGENCIES (MANUAL)
// ===============================
const createEmergedFromEmergencies = async (
  mainId,
  mergeIds = [],
  responderKebeleId,
) => {
  const transaction = await sequelize.transaction();

  try {
    const allIds = [...new Set([mainId, ...mergeIds])]
      .map(Number)
      .filter(Boolean);

    if (allIds.length === 0) {
      throw new Error("No valid emergency IDs provided");
    }

    const emergencies = await Emergency.findAll({
      where: { id: { [Op.in]: allIds } },
      transaction,
    });

    if (emergencies.length !== allIds.length) {
      throw new Error("Some emergencies not found");
    }

    const main = emergencies.find((e) => e.id === Number(mainId));
    if (!main) throw new Error("Main emergency not found");

    // ===============================
    // 📍 SAME KEBELE RULE
    // ===============================
    const sameKebele = emergencies.every((e) => e.kebeleId === main.kebeleId);

    if (!sameKebele) {
      throw new Error("Cannot merge emergencies from different kebeles");
    }

    // ===============================
    // ⚠️ SAME TYPE RULE (YOUR REQUIREMENT)
    // ===============================
    const sameType = emergencies.every(
      (e) => e.emergencyTypeId === main.emergencyTypeId,
    );

    if (!sameType) {
      throw new Error("Cannot merge different emergency types");
    }

    // ===============================
    // 🔒 responder restriction (optional safety)
    // ===============================
    if (
      responderKebeleId &&
      Number(main.kebeleId) !== Number(responderKebeleId)
    ) {
      throw new Error("Not allowed outside assigned kebele");
    }

    // ===============================
    // 🔍 check existing group
    // ===============================
    const existingGroupId = emergencies.find((e) => e.emergedId)?.emergedId;

    let group;

    if (existingGroupId) {
      group = await Emerged.findByPk(existingGroupId, { transaction });

      if (!group) throw new Error("Existing group not found");
    } else {
      // 🆕 CREATE GROUP
      group = await Emerged.create(
        {
          summary: main.description || "Grouped emergency case",
          kebeleId: main.kebeleId,
          subdivision: main.subdivision,
          street: main.street,
          status: "reported",
        },
        { transaction },
      );
    }

    // ===============================
    // 🔗 LINK EMERGENCIES
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
// 📦 GET GROUPED EMERGENCIES
// ===============================
const getAllEmerged = async (kebeleId = null) => {
  const whereClause = kebeleId ? { kebeleId } : {};

  const groups = await Emerged.findAll({
    where: whereClause,
    include: [
      {
        model: Emergency,
        as: "emergencies",
        include: [
          { model: EmergencyType, as: "emergencyType" },
          { model: Category, as: "category" },
          { model: User, as: "user" },
          { model: Guest, as: "guest" },
        ],
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
      reportCount: ems.length,

      emergencies: ems.map((e) => ({
        id: e.id,
        emergencyType: e.emergencyType?.name || null,
        category: e.category?.name || null,
        description: e.description || null,
        reporterType: e.user ? "user" : "guest",
        reporterName: e.user ? e.user.fullName : e.guest?.contactNo || "Guest",
        deviceId: e.deviceId,
        status: e.status,
        createdAt: e.createdAt,
      })),
    };
  });
};
// ===============================
// 🟡 UNASSIGNED EMERGENCIES
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

  if (!group) throw new Error("Group not found");

  if (kebeleId && group.kebeleId !== kebeleId) {
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

    if (!group) throw new Error("Group not found");

    if (kebeleId && group.kebeleId !== kebeleId) {
      throw new Error("Not allowed to delete this group");
    }

    // unlink emergencies
    await Emergency.update(
      { emergedId: null },
      {
        where: { emergedId: id },
        transaction,
      },
    );

    await group.destroy({ transaction });

    await transaction.commit();

    return { message: "Group deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  createEmergedFromEmergencies,
  getAllEmerged,
  getUnassignedEmergencies,
  updateEmerged,
  deleteEmerged,
};
