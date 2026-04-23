const { Emergency, Emerged, sequelize } = require("../models");

/**
 * MERGE emergencies into one group
 */
const createEmergedFromEmergencies = async (mainId, mergeIds) => {
  const transaction = await sequelize.transaction();

  try {
    const allIds = [...new Set([mainId, ...mergeIds])];

    const main = await Emergency.findByPk(mainId, { transaction });
    if (!main) throw new Error("Main emergency not found");

    const emergencies = await Emergency.findAll({
      where: { id: allIds },
      transaction,
    });

    if (emergencies.length === 0) {
      throw new Error("No emergencies found to merge");
    }

    const invalid = emergencies.some((e) => e.kebeleId !== main.kebeleId);
    if (invalid) {
      throw new Error("Cannot merge emergencies from different kebeles");
    }

    const alreadyMerged = emergencies.some((e) => e.emergedId);
    if (alreadyMerged) {
      throw new Error("Some emergencies are already merged");
    }

    const emerged = await Emerged.create(
      {
        description: main.description,
        kebeleId: main.kebeleId,
        subdivision: main.subdivision,
        street: main.street,
        location: main.location,
        status: "reported",
        reportedCount: allIds.length,
      },
      { transaction },
    );

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

/**
 * GET all merged groups (for UI one-row display)
 */
const getAllEmerged = async () => {
  const groups = await Emerged.findAll({
    order: [["createdAt", "DESC"]],
  });

  return Promise.all(
    groups.map(async (group) => {
      const count = await Emergency.count({
        where: { emergedId: group.id },
      });

      return {
        id: group.id,
        description: group.description,
        kebeleId: group.kebeleId,
        subdivision: group.subdivision,
        street: group.street,
        location: group.location,
        status: group.status,
        reportedCount: count,
      };
    }),
  );
};

/**
 * UPDATE merged group (Emerged)
 */
const updateEmerged = async (id, data) => {
  const group = await Emerged.findByPk(id);

  if (!group) {
    throw new Error("Merged group not found");
  }

  await group.update(data);

  return group;
};

/**
 * DELETE merged group + unlink emergencies
 */
const deleteEmerged = async (id) => {
  const transaction = await sequelize.transaction();

  try {
    const group = await Emerged.findByPk(id, { transaction });

    if (!group) {
      throw new Error("Merged group not found");
    }

    // 🔥 unlink emergencies first
    await Emergency.update(
      { emergedId: null },
      {
        where: { emergedId: id },
        transaction,
      },
    );

    // delete group
    await group.destroy({ transaction });

    await transaction.commit();

    return { message: "Merged group deleted successfully" };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
};

module.exports = {
  createEmergedFromEmergencies,
  getAllEmerged,
  updateEmerged,
  deleteEmerged,
};
