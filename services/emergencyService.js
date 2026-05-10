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
 * Prioritizes detecting the source language to handle Amharic or English inputs.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  // Normalize input into a working object
  let data =
    typeof fieldData === "string"
      ? { _raw: fieldData } // plain string — need to detect language
      : { ...fieldData };

  // Case 1: plain string — detect language first
  if (data._raw) {
    const rawText = data._raw;
    delete data._raw;

    try {
      const toEn = await translate(rawText, { to: "en" });
      const detectedLang = toEn.from?.language?.iso || "en";

      if (detectedLang === "am") {
        data.am = rawText;
        data.en = toEn.text;
      } else {
        data.en = rawText;
        try {
          const toAm = await translate(rawText, { to: "am" });
          data.am = toAm.text;
        } catch (err) {
          console.error("en→am translation failed:", err.message);
          data.am = rawText;
        }
      }
    } catch (err) {
      console.error("Language detection / translation failed:", err.message);
      data.en = rawText;
      data.am = rawText;
    }
    return data;
  }

  // Case 2: { am } only
  if (data.am && !data.en) {
    try {
      const toEn = await translate(data.am, { to: "en" });
      data.en = toEn.text;
    } catch (err) {
      data.en = data.am;
    }
  }

  // Case 3: { en } only
  if (data.en && !data.am) {
    try {
      const toAm = await translate(data.en, { to: "am" });
      data.am = toAm.text;
    } catch (err) {
      data.am = data.en;
    }
  }

  return data;
};

/**
 * Localize a plain emergency object for a specific language.
 */
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

  const flattenNested = (obj) => {
    if (!obj) return;
    ["name", "description"].forEach((f) => {
      if (obj[f] && typeof obj[f] === "object") {
        obj[f] = obj[f][lang] || obj[f]["en"] || Object.values(obj[f])[0];
      }
    });
  };

  flattenNested(plain.emergencyType);
  flattenNested(plain.category);
  flattenNested(plain.kebele);

  return plain;
};

// =========================
// CREATE / UPDATE / DELETE
// =========================

const createGuestEmergency = async (data, file, transaction) => {
  const emergencyData = { ...data };

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

  if (!kebeleId || !subdivision)
    throw new Error("Kebele ID and Subdivision are required");

  const location =
    latitude && longitude
      ? { latitude: parseFloat(latitude), longitude: parseFloat(longitude) }
      : null;

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

const getEmergenciesForResponderTeam = async (responderTeamId, lang = "en") => {
  const team = await ResponderTeam.findByPk(responderTeamId);
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

  return emergencies.map((e) => localizeEmergency(e, lang));
};

const getAllEmergenciesForAdmin = async (lang = "en") => {
  const emergencies = await Emergency.findAll({
    include: [
      { model: EmergencyType, as: "emergencyType" },
      { model: Category, as: "category" },
      { model: Kebele, as: "kebele" },
      {
        model: User,
        as: "user",
        attributes: ["id", "fullName", "email", "phone"],
      },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies.map((e) => {
    const localized = localizeEmergency(e, lang);
    return {
      ...localized,
      reporterType: localized.user ? "user" : "guest",
      reporterName: localized.user
        ? localized.user.fullName
        : localized.guest?.contactNo || "Guest",
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
    ],
    order: [["createdAt", "DESC"]],
  });
  return emergencies.map((e) => localizeEmergency(e, lang));
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
      },
      { model: Category, as: "category" },
      { model: Kebele, as: "kebele" },
    ],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
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
