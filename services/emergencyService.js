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
  ResponderTeamKebele,
} = require("../models");
const translate = require("google-translate-api-x");

// Hard-coded mapping for agency types
const emergencyTypeToAgencyType = {
  Crime: "Police",
  Health: "Health",
  Fire: "Fire",
};

// Default EmergencyType ID for fallback
const DEFAULT_EMERGENCY_TYPE_ID = "00000000-0000-0000-0000-000000000001";

// =========================
// HELPERS
// =========================

/**
 * Auto-translate a field value into { en, am }.
 * Accepts a plain string or an existing { en, am } object.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  let data =
    typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.error("Auto-translation failed:", err.message);
      data.am = data.en; // Fallback so the UI is never empty
    }
  }
  return data;
};

/**
 * Localize a plain emergency object for a specific language.
 * `fields` is the list of JSONB columns to flatten (e.g. ["description","subdivision"]).
 * Nested emergencyType / kebele / category associations are also flattened.
 */
const localizeEmergency = (item, lang, fields = ["description", "subdivision"]) => {
  if (!item) return null;

  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  // Flatten own JSONB fields
  fields.forEach((field) => {
    if (plain[field] && typeof plain[field] === "object") {
      plain[field] =
        plain[field][lang] ||
        plain[field]["en"] ||
        Object.values(plain[field])[0];
    }
  });

  // Flatten nested emergencyType name/description
  if (plain.emergencyType && typeof plain.emergencyType === "object") {
    ["name", "description"].forEach((f) => {
      if (plain.emergencyType[f] && typeof plain.emergencyType[f] === "object") {
        plain.emergencyType[f] =
          plain.emergencyType[f][lang] ||
          plain.emergencyType[f]["en"] ||
          Object.values(plain.emergencyType[f])[0];
      }
    });
  }

  // Flatten nested category name
  if (plain.category && typeof plain.category === "object") {
    if (plain.category.name && typeof plain.category.name === "object") {
      plain.category.name =
        plain.category.name[lang] ||
        plain.category.name["en"] ||
        Object.values(plain.category.name)[0];
    }
  }

  // Flatten nested kebele name
  if (plain.kebele && typeof plain.kebele === "object") {
    if (plain.kebele.name && typeof plain.kebele.name === "object") {
      plain.kebele.name =
        plain.kebele.name[lang] ||
        plain.kebele.name["en"] ||
        Object.values(plain.kebele.name)[0];
    }
  }

  return plain;
};

// =========================
// CREATE GUEST EMERGENCY
// =========================
const createGuestEmergency = async (data, file, transaction) => {
  try {
    const emergencyData = { ...data };

    emergencyData.deviceId = emergencyData.deviceId || null;

    if (emergencyData.kebeleId || emergencyData.kebele) {
      emergencyData.kebeleId = parseInt(
        emergencyData.kebeleId || emergencyData.kebele
      );
      delete emergencyData.kebele;
    }

    if (!emergencyData.kebeleId) {
      throw new Error("kebeleId is required");
    }

    if (emergencyData.latitude && emergencyData.longitude) {
      emergencyData.location = {
        latitude: parseFloat(emergencyData.latitude),
        longitude: parseFloat(emergencyData.longitude),
      };
      delete emergencyData.latitude;
      delete emergencyData.longitude;
    }

    if (emergencyData.time) {
      const d = new Date(emergencyData.time);
      emergencyData.time = [
        String(d.getHours()).padStart(2, "0"),
        String(d.getMinutes()).padStart(2, "0"),
        String(d.getSeconds()).padStart(2, "0"),
      ].join(":");
    }

    // Translate JSONB fields before saving
    if (emergencyData.description) {
      emergencyData.description = await autoTranslate(emergencyData.description);
    }
    if (emergencyData.subdivision) {
      emergencyData.subdivision = await autoTranslate(emergencyData.subdivision);
    }

    if (file) {
      emergencyData.mediaUrl = `/uploads/${file.filename}`;
    }

    emergencyData.reporterType = "guest";
    emergencyData.status = "reported";

    return await Emergency.create(
      emergencyData,
      transaction ? { transaction } : {}
    );
  } catch (error) {
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
    kebeleId,
    subdivision,
    street,
    location,
    latitude,
    longitude,
    description,
    ...rest
  } = emergencyData;

  if (latitude && longitude) {
    location = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
    };
  }

  if (!kebeleId || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  const kebeleRecord = await Kebele.findByPk(kebeleId);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  // Translate JSONB fields before saving
  const translatedSubdivision = await autoTranslate(subdivision);
  const translatedDescription = await autoTranslate(description);

  const mediaUrl = file ? `/public/uploads/${file.filename}` : null;

  return await Emergency.create({
    ...rest,
    kebeleId: kebeleRecord.id,
    subdivision: translatedSubdivision,
    street,
    description: translatedDescription,
    location,
    mediaUrl,
    emergencyTypeId,
    categoryId,
    time,
    mediaType:
      mediaType ??
      (file
        ? file.mimetype.startsWith("video")
          ? "video"
          : "photo"
        : null),
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
  isGuest = false
) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };

  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  // Translate any JSONB fields being updated
  if (updatedData.description) {
    updatedData.description = await autoTranslate(updatedData.description);
  }
  if (updatedData.subdivision) {
    updatedData.subdivision = await autoTranslate(updatedData.subdivision);
  }

  if (file) {
    updatedData.mediaUrl = `/public/uploads/${file.filename}`;
    updatedData.mediaType = file.mimetype.startsWith("video") ? "video" : "photo";
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
const getEmergencies = async (userOrGuestId, isGuest = false, lang = "en") => {
  const whereClause = isGuest
    ? { guestId: userOrGuestId }
    : { citizenId: userOrGuestId };

  const emergencies = await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Kebele, as: "kebele" },
    ],
  });

  if (lang === "all") return emergencies;
  return emergencies.map((e) => localizeEmergency(e, lang));
};

// =========================
// GET EMERGENCIES BY AGENCY
// =========================
const getEmergenciesByAgency = async (agencyId, lang = "en") => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) return [];

  const handledEmergencyTypes = Object.entries(emergencyTypeToAgencyType)
    .filter(([, aType]) => aType === agencyTypeName)
    .map(([etype]) => etype);

  if (!handledEmergencyTypes.length) return [];

  const emergencies = await Emergency.findAll({
    include: [
      {
        model: EmergencyType,
        as: "emergencyType",
        where: { name: { [Op.contains]: handledEmergencyTypes } },
        attributes: ["id", "name", "description"],
      },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return emergencies;
  return emergencies.map((e) => localizeEmergency(e, lang));
};

// =========================
// GET EMERGENCIES FOR RESPONDER TEAM
// =========================
const getEmergenciesForResponderTeam = async (responderTeamId, lang = "en") => {
  const team = await ResponderTeam.findByPk(responderTeamId, {
    include: [{ model: Agency, as: "agency" }],
  });

  if (!team) throw new Error("Team not found");

  const roleMapping = { 2: 1, 1: 2, 3: 3 };
  const targetType = roleMapping[team.agency.agencyTypeId] || 1;

  const emergencies = await Emergency.findAll({
    where: {
      emergencyTypeId: targetType,
      status: { [Op.ne]: "resolved" },
    },
    subQuery: false,
    include: [
      {
        model: Kebele,
        as: "kebele",
        required: true,
        include: [
          {
            model: ResponderTeam,
            as: "teams",
            where: { id: responderTeamId },
            required: true,
            through: { model: ResponderTeamKebele, attributes: [] },
          },
        ],
      },
      { model: EmergencyType, as: "emergencyType", attributes: ["id", "name"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return emergencies;
  return emergencies.map((e) => localizeEmergency(e, lang));
};

// =========================
// GET ALL EMERGENCIES FOR ADMIN
// =========================
const getAllEmergenciesForAdmin = async (lang = "en") => {
  try {
    const emergencies = await Emergency.findAll({
      include: [
        { model: EmergencyType, as: "emergencyType", attributes: ["id", "name"] },
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Kebele, as: "kebele", attributes: ["id", "name"] },
        { model: User, as: "user", attributes: ["id", "fullName", "email", "phone"] },
        { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
      ],
      order: [["createdAt", "DESC"]],
    });

    return emergencies.map((e) => {
      const localized = lang === "all" ? e.get({ plain: true }) : localizeEmergency(e, lang);
      return {
        id: localized.id,
        emergencyType:
          typeof localized.emergencyType?.name === "object"
            ? localized.emergencyType.name[lang] || localized.emergencyType.name["en"]
            : localized.emergencyType?.name || null,
        category:
          typeof localized.category?.name === "object"
            ? localized.category.name[lang] || localized.category.name["en"]
            : localized.category?.name || null,
        kebele:
          typeof localized.kebele?.name === "object"
            ? localized.kebele.name[lang] || localized.kebele.name["en"]
            : localized.kebele?.name || null,
        subdivision: localized.subdivision,
        street: localized.street,
        reporterType: localized.user ? "user" : "guest",
        reporterName: localized.user
          ? localized.user.fullName || "Registered User"
          : localized.guest?.contactNo || "Guest",
        deviceId: localized.deviceId,
        status: localized.status,
        createdAt: localized.createdAt,
      };
    });
  } catch (err) {
    console.error("❌ Error in getAllEmergenciesForAdmin:", err);
    throw err;
  }
};

// =========================
// GET SINGLE EMERGENCY BY ID
// =========================
const getEmergencyById = async (id, lang = "en") => {
  try {
    const emergency = await Emergency.findByPk(id, {
      include: [
        { model: EmergencyType, as: "emergencyType", attributes: ["id", "name", "description"] },
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Kebele, as: "kebele", attributes: ["id", "name"] },
        { model: User, as: "user", attributes: ["id", "fullName", "email", "phone"] },
        { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
      ],
    });

    if (!emergency) return null;

    const base =
      lang === "all"
        ? emergency.toJSON()
        : localizeEmergency(emergency, lang);

    return {
      ...base,
      reporterName: emergency.user
        ? emergency.user.fullName
        : emergency.guest?.contactNo || "Anonymous Guest",
      reporterPhone: emergency.user
        ? emergency.user.phone
        : emergency.guest?.contactNo,
      location:
        typeof base.location === "string"
          ? JSON.parse(base.location)
          : base.location,
    };
  } catch (err) {
    console.error("❌ Error in getEmergencyById:", err);
    throw err;
  }
};

// =========================
// UPDATE EMERGENCY STATUS
// =========================
const updateEmergencyStatus = async (emergencyId, status, report = null) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found in database");

  emergency.status = status;
  if (report) emergency.report = report;

  return await emergency.save();
};

// =========================
// GET EMERGENCIES BY DEVICE ID
// =========================
const getEmergenciesByDeviceId = async (deviceId, lang = "en") => {
  if (!deviceId) throw new Error("deviceId is required");

  const emergencies = await Emergency.findAll({
    where: { deviceId },
    include: [
      { model: EmergencyType, as: "emergencyType", attributes: ["id", "name"] },
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
      { model: User, as: "user", attributes: ["id", "fullName"] },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies.map((e) => {
    const localized = lang === "all" ? e.get({ plain: true }) : localizeEmergency(e, lang);
    return {
      id: localized.id,
      emergencyType:
        typeof localized.emergencyType?.name === "object"
          ? localized.emergencyType.name[lang] || localized.emergencyType.name["en"]
          : localized.emergencyType?.name || null,
      category:
        typeof localized.category?.name === "object"
          ? localized.category.name[lang] || localized.category.name["en"]
          : localized.category?.name || null,
      kebele:
        typeof localized.kebele?.name === "object"
          ? localized.kebele.name[lang] || localized.kebele.name["en"]
          : localized.kebele?.name || null,
      subdivision: localized.subdivision,
      street: localized.street,
      status: localized.status,
      reporterType: localized.user ? "user" : "guest",
      reporterName: localized.user
        ? localized.user.fullName
        : localized.guest?.contactNo || "Guest",
      deviceId: localized.deviceId,
      createdAt: localized.createdAt,
    };
  });
};

module.exports = {
  createGuestEmergency,
  createUserEmergency,
  updateEmergency,
  deleteEmergency,
  getEmergencies,
  getEmergencyById,
  getEmergenciesForResponderTeam,
  getEmergenciesByAgency,
  getAllEmergenciesForAdmin,
  updateEmergencyStatus,
  getEmergenciesByDeviceId,
};