const { Guest, Emergency } = require("../models");


const createGuest = async (contactNo) => {
  if (!contactNo) throw new Error("contactNo is required");

  // Optional: check if guest already exists
  let guest = await Guest.findOne({ where: { contactNo } });

  if (!guest) {
    guest = await Guest.create({ contactNo });
  }

  return guest;
};
// Fields a guest may set on an emergency. Everything else is ignored.
const GUEST_EMERGENCY_FIELDS = [
  "description",
  "subdivision",
  "street",
  "kebeleId",
  "emergencyTypeId",
  "categoryId",
  "location",
  "time",
  "deviceId",
];

const pickGuestFields = (data = {}) =>
  GUEST_EMERGENCY_FIELDS.reduce((acc, f) => {
    if (data[f] !== undefined) acc[f] = data[f];
    return acc;
  }, {});

// Create a new emergency
const createEmergency = async (guestId, emergencyData) => {
  return await Emergency.create({
    ...pickGuestFields(emergencyData),
    guestId,
    reporterType: "guest",
    status: "reported", // default status
  });
};

// Update an existing emergency
const updateEmergency = async (guestId, emergencyId, updatedData) => {
  const emergency = await Emergency.findOne({
    where: { id: emergencyId, guestId }
  });

  if (!emergency) throw new Error("Emergency not found for this guest");

  return await emergency.update(pickGuestFields(updatedData));
};

// Delete an emergency
const deleteEmergency = async (guestId, emergencyId) => {
  const emergency = await Emergency.findOne({
    where: { id: emergencyId, guestId }
  });

  if (!emergency) throw new Error("Emergency not found for this guest");

  await emergency.destroy();
  return { message: "Emergency deleted successfully" };
};

// Get all emergencies for this guest
const getEmergencies = async (guestId) => {
  return await Emergency.findAll({
    where: { guestId },
    order: [["createdAt", "DESC"]]
  });
};

module.exports = {
  createEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  createGuest
};
