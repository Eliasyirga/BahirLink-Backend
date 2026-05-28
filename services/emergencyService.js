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

const emergencyTypeToAgencyType = {
  Crime: "Police",
  Medical: "Health",
  Fire: "Fire",
};

const DEFAULT_EMERGENCY_TYPE_ID = "00000000-0000-0000-0000-000000000001";

// =========================
// SHARED KEBELE INCLUDE
// Reused across all retrieval functions so every response carries
// kebele.teams — the array the frontend resolveStation() reads from.
// =========================
const kebeleWithTeams = {
  model: Kebele,
  as: "kebele",
  attributes: ["id", "name"],
  include: [
    {
      model: ResponderTeam,
      as: "teams",
      attributes: ["id", "name"],
      through: { model: ResponderTeamKebele, attributes: [] },
      required: false, // LEFT JOIN — still return emergency if no team assigned
    },
  ],
};

// =========================
// HELPERS
// =========================

/**
 * Auto-translate a field value into { en, am }.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  let data =
    typeof fieldData === "string" ? { _raw: fieldData } : { ...fieldData };

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

  if (data.am && !data.en) {
    try {
      const toEn = await translate(data.am, { to: "en" });
      data.en = toEn.text;
    } catch (err) {
      console.error("am→en translation failed:", err.message);
      data.en = data.am;
    }
  }

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
 * Also localizes team names nested inside kebele.teams.
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

  // Localize team names inside kebele.teams
  if (Array.isArray(plain.kebele?.teams)) {
    plain.kebele.teams = plain.kebele.teams.map((t) => ({
      ...t,
      name:
        t.name && typeof t.name === "object"
          ? t.name[lang] || t.name["en"] || Object.values(t.name)[0]
          : t.name,
    }));
  }

  return plain;
};

// =========================
// CREATE / UPDATE / DELETE
// =========================

const createGuestEmergency = async (data, file, transaction) => {
  try {
    const emergencyData = { ...data };

    let rawKebele = emergencyData.kebeleId || emergencyData.kebele;
    let validKebeleId = null;

    if (rawKebele) {
      // Try to parse it as an integer first (in case it's already an ID)
      const parsedId = parseInt(rawKebele, 10);

      if (!isNaN(parsedId)) {
        validKebeleId = parsedId;
      } else {
        const foundKebele = await Kebele.findOne({
          where: {
            name: {
              [Op.iLike]: `%${rawKebele.trim()}%`, // Case-insensitive partial match
            },
          },
          transaction,
        });

        if (foundKebele) {
          validKebeleId = foundKebele.id;
        }
      }
    }

    delete emergencyData.kebele;

    if (!validKebeleId) {
      const error = new Error(
        `Could not resolve location reference '${rawKebele}' to a valid Kebele ID.`,
      );
      error.statusCode = 400;
      throw error;
    }
    emergencyData.kebeleId = validKebeleId;

    if (emergencyData.latitude && emergencyData.longitude) {
      const lat = parseFloat(emergencyData.latitude);
      const lng = parseFloat(emergencyData.longitude);

      if (!isNaN(lat) && !isNaN(lng)) {
        emergencyData.location = {
          type: "Point",
          coordinates: [lng, lat],
        };
      }
      delete emergencyData.latitude;
      delete emergencyData.longitude;
    }

    // 3. Safe Time Formatting
    if (emergencyData.time) {
      const d = new Date(emergencyData.time);
      if (!isNaN(d.getTime())) {
        emergencyData.time = [
          String(d.getHours()).padStart(2, "0"),
          String(d.getMinutes()).padStart(2, "0"),
          String(d.getSeconds()).padStart(2, "0"),
        ].join(":");
      } else {
        delete emergencyData.time;
      }
    }

    // 4. Handle Translations
    if (emergencyData.description) {
      emergencyData.description = await autoTranslate(
        emergencyData.description,
      );
    }
    if (emergencyData.subdivision) {
      emergencyData.subdivision = await autoTranslate(
        emergencyData.subdivision,
      );
    }

    // 5. Cloudinary Media Assets
    if (file) {
      emergencyData.mediaUrl = file.path;
      emergencyData.mediaPublicId = file.filename;
    }

    emergencyData.reporterType = "guest";
    emergencyData.status = "reported";

    // 6. Persist to Database
    return await Emergency.create(
      emergencyData,
      transaction ? { transaction } : {},
    );
  } catch (error) {
    console.error("❌ Error inside createGuestEmergency:", error.message);
    if (error.parent) {
      console.error("SQL Detail:", error.parent.detail || error.parent.message);
    }
    throw error;
  }
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

  const kebeleRecord = await Kebele.findByPk(kebeleId);
  if (!kebeleRecord) throw new Error("Invalid kebele ID");

  const translatedSubdivision = await autoTranslate(subdivision);
  const translatedDescription = await autoTranslate(description);

  return await Emergency.create({
    ...rest,
    kebeleId,
    subdivision: translatedSubdivision,
    street,
    description: translatedDescription,
    location,
    // FIXED: Maps to Cloudinary secure URL string and records public ID
    mediaUrl: file ? file.path : null,
    mediaPublicId: file ? file.filename : null,
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

  if (updatedData.description) {
    updatedData.description = await autoTranslate(updatedData.description);
  }
  if (updatedData.subdivision) {
    updatedData.subdivision = await autoTranslate(updatedData.subdivision);
  }

  // FIXED: Captures Cloudinary secure paths and stores the public ID for tracking
  if (file) {
    updatedData.mediaUrl = file.path;
    updatedData.mediaPublicId = file.filename;
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

const getEmergencies = async (userOrGuestId, isGuest = false, lang = "en") => {
  const whereClause = isGuest
    ? { guestId: userOrGuestId }
    : { citizenId: userOrGuestId };

  const emergencies = await Emergency.findAll({
    where: whereClause,
    order: [["createdAt", "DESC"]],
    include: [{ model: EmergencyType, as: "emergencyType" }, kebeleWithTeams],
  });

  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
};

// =========================
// GET EMERGENCIES BY AGENCY
// Now includes kebele.teams so the frontend resolveStation() works.
// =========================
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
      kebeleWithTeams,
    ],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? emergencies
    : emergencies.map((e) => localizeEmergency(e, lang));
};

const getEmergenciesForResponderTeam = async (responderTeamId, lang = "en") => {
  const team = await ResponderTeam.findByPk(responderTeamId, {
    include: [
      {
        model: Agency,
        as: "agency",
        include: { model: AgencyType, as: "agencyType" },
      },
    ],
  });
  if (!team) throw new Error("Team not found");
  if (!team.agency) throw new Error("Agency not found for this team");

  const agencyTypeName =
    typeof team.agency.agencyType?.name === "object"
      ? team.agency.agencyType.name.en
      : team.agency.agencyType?.name;

  if (!agencyTypeName) return [];

  const handledEmergencyTypes = Object.entries(emergencyTypeToAgencyType)
    .filter(([, aType]) => aType === agencyTypeName)
    .map(([etype]) => etype);

  if (!handledEmergencyTypes.length) return [];

  const emergencies = await Emergency.findAll({
    where: {
      // Modifying this line allows ALL statuses (pending, in-progress, resolved, completed) to load
      "$kebele.teams.id$": responderTeamId,
    },
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
            attributes: ["id", "name"],
            where: { id: responderTeamId },
            required: true,
            through: { attributes: [] },
          },
        ],
      },
      {
        model: EmergencyType,
        as: "emergencyType",
        where: { name: { en: { [Op.in]: handledEmergencyTypes } } },
        attributes: ["id", "name", "description"],
      },
      {
        model: Category,
        as: "category",
        attributes: ["id", "name"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });

  const toLocale = (field) => {
    if (!field) return "";
    let target = field;

    if (typeof field === "string" && field.trim().startsWith("{")) {
      try {
        target = JSON.parse(field);
      } catch (e) {
        return field;
      }
    }

    if (typeof target === "object" && target !== null) {
      return target[lang] || target["en"] || Object.values(target)[0] || "";
    }

    return target;
  };

  return emergencies.map((e) => {
    const item = e.get({ plain: true });

    return {
      ...item,
      description: toLocale(item.description),
      subdivision: toLocale(item.subdivision),
      emergencyType: item.emergencyType
        ? {
            ...item.emergencyType,
            name: toLocale(item.emergencyType.name),
            description: toLocale(item.emergencyType.description),
          }
        : null,
      category: item.category
        ? { ...item.category, name: toLocale(item.category.name) }
        : null,
      kebele: item.kebele
        ? {
            ...item.kebele,
            name: toLocale(item.kebele.name),
            teams: (item.kebele.teams || []).map((t) => ({
              ...t,
              name: toLocale(t.name),
            })),
          }
        : null,
    };
  });
};

const getAllEmergenciesForAdmin = async (lang = "en") => {
  try {
    const emergencies = await Emergency.findAll({
      include: [
        {
          model: EmergencyType,
          as: "emergencyType",
          attributes: ["id", "name"],
        },
        { model: Category, as: "category", attributes: ["id", "name"] },
        kebeleWithTeams,
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
      const localized =
        lang === "all" ? e.get({ plain: true }) : localizeEmergency(e, lang);

      const assignedTeam = localized.kebele?.teams?.[0] || null;

      return {
        id: localized.id,
        emergencyType:
          typeof localized.emergencyType?.name === "object"
            ? localized.emergencyType.name[lang] ||
              localized.emergencyType.name["en"]
            : localized.emergencyType?.name || null,
        category:
          typeof localized.category?.name === "object"
            ? localized.category.name[lang] || localized.category.name["en"]
            : localized.category?.name || null,
        kebele:
          typeof localized.kebele?.name === "object"
            ? localized.kebele.name[lang] || localized.kebele.name["en"]
            : localized.kebele?.name || null,
        kebeleData: localized.kebele || null,
        assignedStation: assignedTeam
          ? {
              id: assignedTeam.id,
              name:
                typeof assignedTeam.name === "object"
                  ? assignedTeam.name[lang] || assignedTeam.name["en"]
                  : assignedTeam.name,
              kebele:
                typeof localized.kebele?.name === "object"
                  ? localized.kebele.name[lang] || localized.kebele.name["en"]
                  : localized.kebele?.name || null,
            }
          : null,
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

const getEmergencyById = async (id, lang = "en") => {
  try {
    const emergency = await Emergency.findByPk(id, {
      include: [
        {
          model: EmergencyType,
          as: "emergencyType",
          attributes: ["id", "name", "description"],
        },
        { model: Category, as: "category", attributes: ["id", "name"] },
        kebeleWithTeams,
        getEmergenciesForResponderTeam,
        {
          model: User,
          as: "user",
          attributes: ["id", "fullName", "email", "phone"],
        },
        { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
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
  } catch (err) {
    console.error("❌ Error in getEmergencyById:", err);
    throw err;
  }
};

const updateEmergencyStatus = async (emergencyId, status, report = null) => {
  const emergency = await Emergency.findByPk(emergencyId);
  if (!emergency) throw new Error("Emergency record not found in database");

  emergency.status = status;
  if (report) emergency.report = report;

  return await emergency.save();
};

const getEmergenciesByDeviceId = async (deviceId, lang = "en") => {
  if (!deviceId) throw new Error("deviceId is required");

  const emergencies = await Emergency.findAll({
    where: { deviceId },
    include: [
      { model: Category, as: "category", attributes: ["id", "name"] },
      kebeleWithTeams,
      { model: User, as: "user", attributes: ["id", "fullName"] },
      { model: Guest, as: "guest", attributes: ["id", "contactNo"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  return emergencies.map((e) => {
    const localized =
      lang === "all" ? e.get({ plain: true }) : localizeEmergency(e, lang);
    return {
      ...localized,
      emergencyType:
        typeof localized.emergencyType?.name === "object"
          ? localized.emergencyType.name[lang] ||
            localized.emergencyType.name["en"]
          : localized.emergencyType?.name || null,
      category:
        typeof localized.category?.name === "object"
          ? localized.category.name[lang] || localized.category.name["en"]
          : localized.category?.name || null,
      kebele:
        typeof localized.kebele?.name === "object"
          ? localized.kebele.name[lang] || localized.kebele.name["en"]
          : localized.kebele?.name || null,
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
