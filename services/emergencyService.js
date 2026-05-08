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
      data.am = data.en;
    }
  }
  return data;
};

const localizeEmergency = (
  item,
  lang,
  fields = ["description", "subdivision"],
) => {
  if (!item) return null;
  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  fields.forEach((field) => {
    if (plain[field] && typeof plain[field] === "object") {
      plain[field] =
        plain[field][lang] ||
        plain[field]["en"] ||
        Object.values(plain[field])[0];
    }
  });

  if (plain.emergencyType && typeof plain.emergencyType === "object") {
    ["name", "description"].forEach((f) => {
      if (
        plain.emergencyType[f] &&
        typeof plain.emergencyType[f] === "object"
      ) {
        plain.emergencyType[f] =
          plain.emergencyType[f][lang] ||
          plain.emergencyType[f]["en"] ||
          Object.values(plain.emergencyType[f])[0];
      }
    });
  }

  if (plain.category?.name && typeof plain.category.name === "object") {
    plain.category.name =
      plain.category.name[lang] ||
      plain.category.name["en"] ||
      Object.values(plain.category.name)[0];
  }

  if (plain.kebele?.name && typeof plain.kebele.name === "object") {
    plain.kebele.name =
      plain.kebele.name[lang] ||
      plain.kebele.name["en"] ||
      Object.values(plain.kebele.name)[0];
  }

  return plain;
};

// =========================
// CREATE / UPDATE / DELETE
// =========================

const createGuestEmergency = async (data, file, transaction) => {
  const emergencyData = { ...data };
  emergencyData.deviceId = emergencyData.deviceId || null;

  if (emergencyData.kebeleId || emergencyData.kebele) {
    emergencyData.kebeleId = parseInt(
      emergencyData.kebeleId || emergencyData.kebele,
    );
    delete emergencyData.kebele;
  }
  if (!emergencyData.kebeleId) throw new Error("kebeleId is required");

  if (emergencyData.latitude && emergencyData.longitude) {
    emergencyData.location = {
      latitude: parseFloat(emergencyData.latitude),
      longitude: parseFloat(emergencyData.longitude),
    };
    delete emergencyData.latitude;
    delete emergencyData.longitude;
  }

  if (emergencyData.description)
    emergencyData.description = await autoTranslate(emergencyData.description);
  if (emergencyData.subdivision)
    emergencyData.subdivision = await autoTranslate(emergencyData.subdivision);
  if (file) emergencyData.mediaUrl = `/uploads/${file.filename}`;

  emergencyData.reporterType = "guest";
  emergencyData.status = "reported";

  return await Emergency.create(
    emergencyData,
    transaction ? { transaction } : {},
  );
};

const createUserEmergency = async (userId, emergencyData, file) => {
  let {
    emergencyTypeId = DEFAULT_EMERGENCY_TYPE_ID,
    categoryId,
    kebeleId,
    subdivision,
    description,
    latitude,
    longitude,
    street,
    ...rest
  } = emergencyData;

  let location =
    latitude && longitude
      ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
      : null;
  if (!kebeleId || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  const translatedSubdivision = await autoTranslate(subdivision);
  const translatedDescription = await autoTranslate(description);

  return await Emergency.create({
    ...rest,
    kebeleId,
    subdivision: translatedSubdivision,
    street,
    description: translatedDescription,
    location,
    mediaUrl: file ? `/public/uploads/${file.filename}` : null,
    emergencyTypeId,
    categoryId,
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

  if (updatedData.description)
    updatedData.description = await autoTranslate(updatedData.description);
  if (updatedData.subdivision)
    updatedData.subdivision = await autoTranslate(updatedData.subdivision);

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

// =========================
// RETRIEVAL LOGIC
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
  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
};

const getEmergenciesByAgency = async (agencyId, lang = "en") => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });
  if (!agency) throw new Error("Agency not found");

  const agencyTypeName =
    typeof agency.agencyType?.name === "object"
      ? agency.agencyType.name.en
      : agency.agencyType?.name;
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
        where: { name: { en: { [Op.in]: handledEmergencyTypes } } },
        attributes: ["id", "name", "description"],
      },
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
};

const getEmergenciesForResponderTeam = async (responderTeamId, lang = "en") => {
  const team = await ResponderTeam.findByPk(responderTeamId, {
    include: [{ model: Agency, as: "agency" }],
  });
  if (!team) throw new Error("Team not found");

  const emergencies = await Emergency.findAll({
    where: { status: { [Op.ne]: "resolved" } },
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
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
    ],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
};

const getAllEmergenciesForAdmin = async (lang = "en") => {
  const emergencies = await Emergency.findAll({
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
      { model: Kebele, as: "kebele" },
      { model: User, as: "user", attributes: ["id", "fullName"] },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies.map((e) => {
    const localized = localizeEmergency(e, lang);
    return {
      id: localized.id,
      emergencyType: localized.emergencyType?.name || null,
      category: localized.category?.name || null,
      kebele: localized.kebele?.name || null,
      subdivision: localized.subdivision,
      street: localized.street,
      reporterType: localized.user ? "user" : "guest",
      reporterName: localized.user
        ? localized.user.fullName
        : localized.guest?.contactNo || "Guest",
      deviceId: localized.deviceId,
      status: localized.status,
      createdAt: localized.createdAt,
    };
  });
};

const getEmergencyById = async (id, lang = "en") => {
  const emergency = await Emergency.findByPk(id, {
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
      { model: Kebele, as: "kebele" },
      { model: User, as: "user" },
      { model: Guest, as: "guest" },
    ],
  });
  if (!emergency) return null;
  const base =
    lang === "all" ? emergency.toJSON() : localizeEmergency(emergency, lang);
  return {
    ...base,
    reporterName: emergency.user
      ? emergency.user.fullName
      : emergency.guest?.contactNo || "Guest",
    location:
      typeof base.location === "string"
        ? JSON.parse(base.location)
        : base.location,
  };
};

const updateEmergencyStatus = async (emergencyId, status, report = null) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found");
  emergency.status = status;
  if (report) emergency.report = report;
  return await emergency.save();
};

const getEmergenciesByDeviceId = async (deviceId, lang = "en") => {
  const emergencies = await Emergency.findAll({
    where: { deviceId },
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
      { model: Kebele, as: "kebele" },
      { model: User, as: "user" },
      { model: Guest, as: "guest" },
    ],
    order: [["createdAt", "DESC"]],
  });
  return emergencies.map((e) => {
    const localized = localizeEmergency(e, lang);
    return {
      ...localized,
      emergencyType: localized.emergencyType?.name,
      category: localized.category?.name,
      kebele: localized.kebele?.name,
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
