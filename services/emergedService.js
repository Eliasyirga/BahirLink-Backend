const { Emergency, Emerged, sequelize } = require("../models");
const { Op } = require("sequelize");

// ===============================
// 🔥 CREATE / MERGE EMERGENCIES
// ===============================
const createEmergedFromEmergencies = async (mainId, mergeIds = []) => {
  const transaction = await sequelize.transaction();

  try {
    const allIds = [...new Set([mainId, ...mergeIds])];

    const emergencies = await Emergency.findAll({
      where: { id: { [Op.in]: allIds } },
      transaction,
    });

    // ❌ validate existence
    if (!emergencies.length) {
      throw new Error("No emergencies found");
    }

    if (emergencies.length !== allIds.length) {
      throw new Error("Some emergencies not found");
    }

    const main = emergencies.find((e) => e.id === mainId);
    if (!main) throw new Error("Main emergency not found");

    // ❌ ensure same kebele
    const invalidKebele = emergencies.some((e) => e.kebeleId !== main.kebeleId);

    if (invalidKebele) {
      throw new Error("Cannot merge emergencies from different kebeles");
    }

    // 🔍 prevent merging different groups
    const groupIds = [
      ...new Set(emergencies.map((e) => e.emergedId).filter(Boolean)),
    ];

    if (groupIds.length > 1) {
      throw new Error("Cannot merge emergencies from different groups");
    }

    const existingGroupId = groupIds[0];

    let emerged;

    if (existingGroupId) {
      // ✅ ADD TO EXISTING GROUP
      emerged = await Emerged.findByPk(existingGroupId, {
        transaction,
      });

      if (!emerged) {
        throw new Error("Existing merged group not found");
      }
    } else {
      // ✅ CREATE NEW GROUP
      emerged = await Emerged.create(
        {
          description: main.description,
          kebeleId: main.kebeleId,
          subdivision: main.subdivision,
          street: main.street,
          location: main.location,
          status: "reported",
        },
        { transaction },
      );
    }

    // 🔗 link emergencies
    await Emergency.update(
      { emergedId: emerged.id },
      {
        where: { id: allIds },
        transaction,
      },
    );

    await transaction.commit();
    return emerged;
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ===============================
// 📥 GET ALL EMERGED GROUPS
// ===============================
const getAllEmerged = async () => {
  const groups = await Emerged.findAll({
    include: [
      {
        model: Emergency,
        as: "emergencies",
        attributes: ["id", "description", "citizenId", "guestId", "createdAt"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return groups.map((group) => {
    const emergencies = group.emergencies || [];

    return {
      id: group.id,
      description: group.description,
      kebeleId: group.kebeleId,
      subdivision: group.subdivision,
      street: group.street,
      location: group.location,
      status: group.status,

      // 🔢 SINGLE SOURCE OF TRUTH
      reportCount: emergencies.length,

      // 👇 UNIQUE REPORTERS ONLY
      reporters: [...new Set(emergencies.map((e) => e.citizenId || e.guestId))],

      // 👇 ALL DESCRIPTIONS
      descriptions: emergencies.map((e) => e.description),

      emergencies,
    };
  });
};

// ===============================
// ✏️ UPDATE EMERGED GROUP
// ===============================
const updateEmerged = async (id, data) => {
  const group = await Emerged.findByPk(id);

  if (!group) {
    throw new Error("Merged group not found");
  }

  await group.update(data);

  return group;
};

// ===============================
// 🗑️ DELETE EMERGED GROUP
// ===============================
const deleteEmerged = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const group = await Emerged.findByPk(id, { transaction });

    if (!group) {
      throw new Error("Merged group not found");
    }

    // 🔥 unlink emergencies safely
    await Emergency.update(
      {
        emergedId: null,
        status: "reported",
      },
      {
        where: { emergedId: id },
        transaction,
      },
    );

    await group.destroy({ transaction });

    await transaction.commit();

    return { message: "Merged group deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

// ===============================
module.exports = {
  createEmergedFromEmergencies,
  getAllEmerged,
  updateEmerged,
  deleteEmerged,
};
