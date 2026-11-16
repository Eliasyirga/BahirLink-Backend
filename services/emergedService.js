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

    const sameType = emergencies.every(
      (e) => e.emergencyTypeId === main.emergencyTypeId,
    );

    if (!sameType) {
      throw new Error("Cannot merge different emergency types");
    }

    if (
      responderKebeleId &&
      Number(main.kebeleId) !== Number(responderKebeleId)
    ) {
      throw new Error("Not allowed outside assigned kebele");
    }

    const existingGroupId = emergencies.find((e) => e.emergedId)?.emergedId;

    let group;

    if (existingGroupId) {
      group = await Emerged.findByPk(existingGroupId, { transaction });

      if (!group) throw new Error("Existing group not found");
    } else {
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

// Shared include + shape for list and single reads.
const emergedInclude = [
  {
    model: Emergency,
    as: "emergencies",
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
      { model: User, as: "user", attributes: ["id", "fullName"] },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
  },
];

const shapeEmerged = (g) => {
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
};

const getAllEmerged = async (kebeleId = null) => {
  const whereClause = kebeleId ? { kebeleId } : {};

  const groups = await Emerged.findAll({
    where: whereClause,
    include: emergedInclude,
    order: [["createdAt", "DESC"]],
  });

  return groups.map(shapeEmerged);
};

const getEmergedById = async (id) => {
  const group = await Emerged.findByPk(id, { include: emergedInclude });
  return group ? shapeEmerged(group) : null;
};

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

// Fields that may be changed on a group. Everything else is ignored.
const EMERGED_EDITABLE_FIELDS = ["summary", "subdivision", "street", "status"];
const EMERGED_STATUSES = ["reported", "in_progress", "resolved"];

/**
 * allowedKebeleIds: null → unrestricted (admin/agency);
 * array → the group's kebele must be in it (responder teams).
 */
const assertKebeleAllowed = (group, allowedKebeleIds, action) => {
  if (
    Array.isArray(allowedKebeleIds) &&
    !allowedKebeleIds.map(Number).includes(Number(group.kebeleId))
  ) {
    throw new Error(`Not allowed to ${action} this group`);
  }
};

const updateEmerged = async (id, data = {}, allowedKebeleIds = null) => {
  const group = await Emerged.findByPk(id);

  if (!group) throw new Error("Group not found");
  assertKebeleAllowed(group, allowedKebeleIds, "update");

  const updates = {};
  EMERGED_EDITABLE_FIELDS.forEach((f) => {
    if (data[f] !== undefined) updates[f] = data[f];
  });
  if (updates.status !== undefined && !EMERGED_STATUSES.includes(updates.status)) {
    throw new Error(`Invalid status. Allowed: ${EMERGED_STATUSES.join(", ")}`);
  }

  return await group.update(updates);
};

// ===============================
// 🗑️ DELETE GROUP
// ===============================
const deleteEmerged = async (id, allowedKebeleIds = null) => {
  const transaction = await sequelize.transaction();

  try {
    const group = await Emerged.findByPk(id, { transaction });

    if (!group) throw new Error("Group not found");

    assertKebeleAllowed(group, allowedKebeleIds, "delete");

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
  getEmergedById,
  getUnassignedEmergencies,
  updateEmerged,
  deleteEmerged,
};
