const { Op } = require("sequelize");
const {
  sequelize,
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

/**
 * CREATE GUEST EMERGENCY (SERVICE)
 * Handles data type parsing, guest verification, and
 * atomic database insertion for BahirLink.
 */
const createGuestEmergency = async (emergencyData, file) => {
  // 1. Destructure incoming data
  const {
    contactNo,
    mediaType,
    emergencyTypeId,
    categoryId,
    time,
    kebele, // Kebele ID (String from Flutter)
    subdivision,
    street,
    latitude, // String from Multipart
    longitude, // String from Multipart
    description,
  } = emergencyData;

  // 2. Strict Validation
  if (!contactNo) throw new Error("Guest contact number is required");
  if (!kebele || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  // 3. Data Type Correction (Vital for Postgres & Multipart)
  const cleanContactNo = String(contactNo).trim();
  const parsedKebeleId = parseInt(kebele);
  const latNum = latitude ? parseFloat(latitude) : null;
  const lngNum = longitude ? parseFloat(longitude) : null;

  if (isNaN(parsedKebeleId))
    throw new Error("Kebele ID must be a valid number");

  // 4. Structured Location Handling (Postgres JSONB)
  const locationObj =
    latNum !== null && lngNum !== null
      ? { latitude: latNum, longitude: lngNum }
      : null;

  // 5. Atomic Transaction Start
  // This uses the sequelize instance imported at the top
  const transaction = await sequelize.transaction();

  try {
    // 6. Verify Kebele Exists
    const kebeleRecord = await Kebele.findByPk(parsedKebeleId, { transaction });
    if (!kebeleRecord)
      throw new Error(`Kebele location not found (ID: ${parsedKebeleId})`);

    // 7. Find or Create Guest
    let guest = await Guest.findOne({
      where: { contactNo: cleanContactNo },
      transaction,
    });

    if (!guest) {
      guest = await Guest.create(
        { contactNo: cleanContactNo },
        { transaction },
      );
    }

    // 8. Media Metadata
    const mediaUrl = file ? `/public/uploads/${file.filename}` : null;
    const finalMediaType =
      mediaType ??
      (file ? (file.mimetype.startsWith("video") ? "video" : "photo") : null);

    // 9. Create Emergency Record
    const emergency = await Emergency.create(
      {
        description: description || "",
        kebeleId: kebeleRecord.id,
        subdivision: subdivision,
        street: street || null,
        location: locationObj,
        mediaUrl,
        mediaType: finalMediaType,
        // UUIDs stay as strings, Integers get parsed
        emergencyTypeId: emergencyTypeId,
        categoryId: categoryId || null,
        // Ensure time is a proper Date object for Postgres DATE/TIMESTAMP columns
        time: time ? new Date(time) : new Date(),
        guestId: guest.id,
        status: "reported",
        reporterType: "guest",
      },
      { transaction },
    );

    // 10. Commit changes
    await transaction.commit();
    return emergency;
  } catch (error) {
    // Rollback if anything fails to prevent "orphan" guests or reports
    if (transaction) await transaction.rollback();

    // This will now show the SPECIFIC Postgres error in your terminal
    console.error("CRITICAL SERVICE ERROR:", error.message);
    throw error;
  }
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
    kebeleId, // From previous fix
    subdivision,
    street,
    location, // This might be a string from Flutter, we will override it
    latitude, // Sent by Flutter request.fields["latitude"]
    longitude, // Sent by Flutter request.fields["longitude"]
    ...rest
  } = emergencyData;

  // 📍 CONVERT TO JSON OBJECT
  // If Flutter sent latitude and longitude, create the JSON object for Sequelize
  if (latitude && longitude) {
    location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
  }

  // Validation
  if (!kebeleId || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  const kebeleRecord = await Kebele.findByPk(kebeleId);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

  // Sequelize will automatically stringify the 'location' object into the JSON column
  return await Emergency.create({
    ...rest,
    kebeleId: kebeleRecord.id,
    subdivision,
    street,
    location, // Now a JS Object: { latitude: 11.3, longitude: 37.3 }
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
        as: "kebele",
        required: true,
        attributes: ["id", "name"],
        include: [
          {
            model: ResponderTeam,
            as: "teams",
            where: { id: responderTeamId },
            attributes: [],
            through: { attributes: [] },
          },
        ],
      },
      {
        model: EmergencyType,
        as: "emergencyType",
        attributes: ["id", "name"],
      },
      {
        model: Category, // 🔥 ADD THIS
        as: "category",
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
          as: "emergencyType",
          attributes: ["id", "name"],
        },
        {
          model: Category,
          as: "category",
          attributes: ["id", "name"],
        },
        {
          model: Kebele,
          as: "kebele",
          attributes: ["id", "name"],
        },
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone"],
        },
        {
          model: Guest,
          as: "guest",
          attributes: ["id", "contactNo"],
        },
      ],
      order: [["createdAt", "DESC"]],
    });

    const result = emergencies.map((e) => ({
      id: e.id,
      emergencyType: e.emergencyType?.name || null,
      category: e.category?.name || null,
      kebele: e.kebele?.name || null,
      subdivision: e.subdivision,
      street: e.street,

      reporterType: e.user ? "user" : "guest",

      reporterName: e.user
        ? e.user.fullName || "Registered User"
        : e.guest?.contactNo || "Guest",

      status: e.status,
      createdAt: e.createdAt,
    }));

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
