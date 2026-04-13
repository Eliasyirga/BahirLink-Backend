const { Op } = require("sequelize");
const {
  Emergency,

  EmergencyType,
  Kebele,
  ResponderTeam,
  Agency,
  AgencyType,
  Category,
  User,
  Guest,
} = require("../models");
const path = require("path");

// Hard-coded mapping for agency types
const emergencyTypeToAgencyType = {
  Crime: "Police",
  Medical: "Health",
  Fire: "Fire",
};

// Default EmergencyType ID for fallback
const DEFAULT_EMERGENCY_TYPE_ID = "00000000-0000-0000-0000-000000000001";

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergency = async (emergencyData, file) => {
  let {
    contactNo,
    mediaType,
    emergencyTypeId = DEFAULT_EMERGENCY_TYPE_ID,
    categoryId,
    time,
    kebele, // kebele ID
    location,
    subdivision,
    street,
    latitude,
    longitude,
    ...rest
  } = emergencyData;

  if (!location && latitude != null && longitude != null) {
    location = { latitude, longitude };
  }

  if (!contactNo) throw new Error("Guest contact number is required");
  contactNo = String(contactNo).trim();
  if (!kebele || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  // Verify kebele exists
  const kebeleRecord = await Kebele.findByPk(kebele);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  // Find or create guest
  let guest = await Guest.findOne({ where: { contactNo } });
  if (!guest) guest = await Guest.create({ contactNo });

  const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

  return await Emergency.create({
    ...rest,
    kebeleId: kebeleRecord.id,
    subdivision,
    street,
    location,
    mediaUrl,
    emergencyTypeId,
    categoryId,
    time,
    mediaType:
      mediaType ??
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null),
    guestId: guest.id,
    status: "reported",
    reporterType: "guest",
  });
};

// =========================
// CREATE USER EMERGENCY
// =========================
const createUserEmergency = async (userId, emergencyData, file) => {
  let {
    mediaType,
    emergencyTypeId = DEFAULT_EMERGENCY_TYPE_ID,
    categoryId,
    time,
    kebele,
    subdivision,
    street,
    location,
    latitude,
    longitude,
    ...rest
  } = emergencyData;

  if (!location && latitude != null && longitude != null) {
    location = { latitude, longitude };
  }

  if (!kebele || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  // Verify kebele exists
  const kebeleRecord = await Kebele.findByPk(kebele);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

  return await Emergency.create({
    ...rest,
    kebeleId: kebeleRecord.id,
    subdivision,
    street,
    location,
    mediaUrl,
    emergencyTypeId,
    categoryId,
    time,
    mediaType:
      mediaType ??
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null),
    citizenId: userId,
    status: "reported",
    reporterType: "user",
  });
};

// =========================
// UPDATE EMERGENCY
// =========================
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

  if (file) {
    updatedData.mediaUrl = `/public/uploads/${file.filename}`;
    updatedData.mediaType = file.mimetype.startsWith("video")
      ? "video"
      : "photo";
  }

  return await emergency.update(updatedData);
};

// =========================
// DELETE EMERGENCY
// =========================
const deleteEmergency = async (userOrGuestId, emergencyId, isGuest = false) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  await emergency.destroy();
  return { message: "Emergency deleted successfully" };
};

// =========================
// GET USER/GUEST EMERGENCIES
// =========================
const getEmergencies = async (userOrGuestId, isGuest = false) => {
  const whereClause = isGuest
    ? { guestId: userOrGuestId }
    : { citizenId: userOrGuestId };

  return await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Kebele, as: "kebele" },
    ],
  });
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgency = async (agencyId) => {
  // 1️⃣ Find agency + its type
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) return [];

  // 2️⃣ Get emergency types handled by this agency type
  const handledEmergencyTypes = Object.entries(emergencyTypeToAgencyType)
    .filter(([etype, aType]) => aType === agencyTypeName)
    .map(([etype]) => etype);

  if (!handledEmergencyTypes.length) return [];

  // 3️⃣ Fetch emergencies for these types
  const emergencies = await Emergency.findAll({
    include: [
      {
        model: EmergencyType,
        as: "emergencyType",
        where: { name: handledEmergencyTypes },
        attributes: ["id", "name", "description"],
      },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies;
};

// =========================
// GET EMERGENCIES FOR A RESONDER TEAM
// =========================
const getEmergenciesForResponderTeam = async (responderTeamId) => {
  const emergencies = await Emergency.findAll({
    include: [
      {
        model: Kebele,
        as: "kebele", // Emergency → Kebele alias
        required: true,
        attributes: ["id", "name"],
        include: [
          {
            model: ResponderTeam,
            as: "teams", // Kebele → ResponderTeam alias
            where: { id: responderTeamId }, // ✅ unique, enough
            attributes: [], // no need to include team info
            through: { attributes: [] }, // hide join table
          },
        ],
      },
      {
        model: EmergencyType,
        as: "emergencyType",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies;
};

const getAllEmergenciesForAdmin = async () => {
  try {
    const emergencies = await Emergency.findAll({
      include: [
        {
          model: EmergencyType,
          attributes: ["name"],
        },
        {
          model: Category,
          attributes: ["name"],
        },
        {
          model: User,
          attributes: ["id", "username", "email", "phone"],
        },
        {
          model: Guest,
          attributes: ["id", "contactNo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    // Normalize reporter type
    const result = emergencies.map((e) => {
      return {
        id: e.id,
        emergencyType: e.emergencyType,
        category: e.category,
        kebele: e.kebele,
        subdivision: e.subdivision,
        street: e.street,
        reporterType: e.citizenId ? "user" : "guest",
        reporterName: e.citizenId
          ? e.User?.username || "Registered User"
          : e.guestId
            ? e.Guest?.contactNo || "Guest"
            : "Unknown",
        status: e.status,
        createdAt: e.createdAt,
      };
    });

    return result;
  } catch (err) {
    console.error("❌ Error in getAllEmergenciesForAdmin:", err);
    throw err;
  }
};

module.exports = {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
  getAllEmergenciesForAdmin,
};
