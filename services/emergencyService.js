const { Emergency, User, Guest } = require("../models");

const createGuestEmergency = async (emergencyData) => {
  let { contactNo, mediaUrl, mediaType, ...rest } = emergencyData;

  if (!contactNo) {
    throw new Error("Guest contact number is required");
  }

  contactNo = String(contactNo).trim();

  if (contactNo.length === 0) {
    throw new Error("Guest contact number cannot be empty");
  }

  const guest = await Guest.create({ contactNo });

  const emergency = await Emergency.create({
    ...rest,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    guestId: guest.id,
    status: "reported",
    reporterType: "guest",
  });

  return emergency;
};

const createUserEmergency = async (userId, emergencyData) => {
  const { mediaUrl, mediaType, ...rest } = emergencyData;

  return await Emergency.create({
    ...rest,
    mediaUrl: mediaUrl || null,
    mediaType: mediaType || null,
    citizenId: userId,
    status: "reported",
    reporterType: "user",
  });
};

const updateEmergency = async (
  userOrGuestId,
  emergencyId,
  updatedData,
  isGuest = false,
) => {
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
  const whereClause = isGuest
    ? { guestId: userOrGuestId }
    : { citizenId: userOrGuestId };

  return await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
  });
};

module.exports = {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
};
