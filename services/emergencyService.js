const { Emergency, User, Guest } = require("../models");

const createUserEmergency = async (userId, emergencyData) => {
  return await Emergency.create({
    ...emergencyData,
    citizenId: userId,
    status: "reported",
  });
};

const createGuestEmergency = async (guestId, emergencyData) => {
  return await Emergency.create({
    ...emergencyData,
    guestId,
    status: "reported",
  });
};

const updateEmergency = async (userOrGuestId, emergencyId, updatedData, isGuest = false) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });

  if (!emergency) throw new Error("Emergency not found");

  return await emergency.update(updatedData);
};

const deleteEmergency = async (userOrGuestId, emergencyId, isGuest = false) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  await emergency.destroy();
  return { message: "Emergency deleted successfully" };
};

const getEmergencies = async (userOrGuestId, isGuest = false) => {
  const whereClause = isGuest ? { guestId: userOrGuestId } : { citizenId: userOrGuestId };
  return await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createUserEmergency,
  createGuestEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
};
