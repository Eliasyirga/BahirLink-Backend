const { Emergency, User, Guest } = require("../models");
const path = require("path");

const createGuestEmergency = async (emergencyData, file) => {
  let { contactNo, mediaType, emergencyTypeId, kebele, subdivision, street, ...rest } = emergencyData;

  if (!contactNo) throw new Error("Guest contact number is required");
  contactNo = String(contactNo).trim();
  if (contactNo.length === 0)
    throw new Error("Guest contact number cannot be empty");

  if (!kebele || !subdivision) 
    throw new Error("Kebele and Subdivision are required");

  // Check if guest already exists
  let guest = await Guest.findOne({ where: { contactNo } });
  if (!guest) guest = await Guest.create({ contactNo });

  // Handle media URL
  let mediaUrl = null;
  if (file) {
    mediaUrl = `/public/uploads/${file.filename}`;
  }

  const emergency = await Emergency.create({
    ...rest,
    kebele,
    subdivision,
    street,
    mediaUrl,
    emergencyTypeId,
    mediaType:
      mediaType ||
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null),
    guestId: guest.id,
    status: "reported",
    reporterType: "guest",
  });

  return emergency;
};

const createUserEmergency = async (userId, emergencyData, file) => {
  const { mediaType, emergencyTypeId, kebele, subdivision, street, ...rest } = emergencyData;

  if (!kebele || !subdivision) 
    throw new Error("Kebele and Subdivision are required");

  let mediaUrl = null;
  if (file) mediaUrl = `/public/uploads/${file.filename}`;

  return await Emergency.create({
    ...rest,
    kebele,
    subdivision,
    street,
    mediaUrl,
    emergencyTypeId,
    mediaType:
      mediaType ||
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null),
    citizenId: userId,
    status: "reported",
    reporterType: "user",
  });
};


const updateEmergency = async (
  userOrGuestId,
  emergencyId,
  updatedData,
  file,
  isGuest = false,
) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  // Update media if new file uploaded
  if (file) {
    updatedData.mediaUrl = `/public/uploads/${file.filename}`;
    updatedData.mediaType = file.mimetype.startsWith("video")
      ? "video"
      : "photo";
  }

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
