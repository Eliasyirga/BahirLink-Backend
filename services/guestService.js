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
// Create a new emergency
const createEmergency = async (guestId, emergencyData) => {
  return await Emergency.create({
    ...emergencyData,
    guestId,
    status: "reported" // default status
  });
};

// Update an existing emergency
const updateEmergency = async (guestId, emergencyId, updatedData) => {
  const emergency = await Emergency.findOne({
    where: { id: emergencyId, guestId }
  });

  if (!emergency) throw new Error("Emergency not found for this guest");

  return await emergency.update(updatedData);
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
