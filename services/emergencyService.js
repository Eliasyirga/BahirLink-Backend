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
 *
 * Accepts:
 *   - A plain string  → language is auto-detected, then both en & am are filled.
 *   - { en }          → translates en → am.
 *   - { am }          → translates am → en.
 *   - { en, am }      → already complete, returned as-is.
 *
 * This means a user who types in Amharic will have their text translated to
 * English automatically, and both versions are stored in the JSONB column.
 */
const autoTranslate = async (fieldData) => {
  if (!fieldData) return null;

  // Normalise input into a working object
  let data =
    typeof fieldData === "string"
      ? { _raw: fieldData } // plain string — need to detect language
      : { ...fieldData };

  // ── Case 1: plain string — detect language first ──────────────────────────
  if (data._raw) {
    const rawText = data._raw;
    delete data._raw;

    try {
      // translate() to "en" returns the detected source language as well
      const toEn = await translate(rawText, { to: "en" });
      const detectedLang = toEn.from?.language?.iso || "en";

      if (detectedLang === "am") {
        // User typed Amharic → store original as am, translation as en
        data.am = rawText;
        data.en = toEn.text;
      } else {
        // User typed English (or other) → store as en, translate to am
        data.en = rawText;
        try {
          const toAm = await translate(rawText, { to: "am" });
          data.am = toAm.text;
        } catch (err) {
          console.error("en→am translation failed:", err.message);
          data.am = rawText; // fallback: copy English text
        }
      }
    } catch (err) {
      console.error("Language detection / translation failed:", err.message);
      // Fallback: save raw text in both fields so the UI is never empty
      data.en = rawText;
      data.am = rawText;
    }

    return data;
  }

  // ── Case 2: { am } only — translate am → en ───────────────────────────────
  if (data.am && !data.en) {
    try {
      const toEn = await translate(data.am, { to: "en" });
      data.en = toEn.text;
    } catch (err) {
      console.error("am→en translation failed:", err.message);
      data.en = data.am; // fallback
    }
  }

  // ── Case 3: { en } only — translate en → am ───────────────────────────────
  if (data.en && !data.am) {
    try {
      const toAm = await translate(data.en, { to: "am" });
      data.am = toAm.text;
    } catch (err) {
      console.error("en→am translation failed:", err.message);
      data.am = data.en; // fallback
    }
  }

  // ── Case 4: { en, am } — already complete ─────────────────────────────────
  return data;
};

/**
 * Localize a plain emergency object for a specific language.
 * `fields` is the list of JSONB columns to flatten (e.g. ["description","subdivision"]).
 * Nested emergencyType / kebele / category associations are also flattened.
 */
const localizeEmergency = (
  item,
  lang,
  fields = ["description", "subdivision"]
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

  // Translate JSONB fields — autoTranslate() detects the input language
  // and ensures both { en, am } are always stored, regardless of whether
  // the user typed in English or Amharic.
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

  // Translate JSONB fields — detects Amharic input and fills both en & am.
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
  isGuest = false
) => {
  const whereClause = isGuest
    ? { id: emergencyId, guestId: userOrGuestId }
    : { id: emergencyId, citizenId: userOrGuestId };
  const emergency = await Emergency.findOne({ where: whereClause });
  if (!emergency) throw new Error("Emergency not found");

  // Translate any JSONB fields being updated — handles Amharic input too.
  if (updatedData.description) {
    updatedData.description = await autoTranslate(updatedData.description);
  }
  if (updatedData.subdivision) {
    updatedData.subdivision = await autoTranslate(updatedData.subdivision);
  }

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
const deleteEmergency = async (
  userOrGuestId,
  emergencyId,
  isGuest = false
) => {
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

const getEmergencies = async (
  userOrGuestId,
  isGuest = false,
  lang = "en"
) => {
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

// =========================
// GET EMERGENCIES FOR RESPONDER TEAM
// =========================
const getEmergenciesForResponderTeam = async (
  responderTeamId,
  lang = "en"
) => {
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
      {
        model: EmergencyType,
        as: "emergencyType",
        attributes: ["id", "name"],
      },
      { model: Category, as: "category", attributes: ["id", "name"] },
    ],
    order: [["createdAt", "DESC"]],
  });

  /**
   * Internal Helper: Always prioritize the requested lang.
   * Falls back to 'en', then the first available string.
   */
  const toLocale = (field) => {
    if (!field || typeof field !== "object") return field;
    return field[lang] || field["en"] || Object.values(field)[0] || "";
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
        ? {
            ...item.category,
            name: toLocale(item.category.name),
          }
        : null,
      kebele: item.kebele
        ? {
            ...item.kebele,
            name: toLocale(item.kebele.name),
          }
        : null,
    };
  });
};

// =========================
// GET ALL EMERGENCIES FOR ADMIN
// =========================
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
        { model: Kebele, as: "kebele", attributes: ["id", "name"] },
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
        lang === "all"
          ? e.get({ plain: true })
          : localizeEmergency(e, lang);
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
        {
          model: EmergencyType,
          as: "emergencyType",
          attributes: ["id", "name", "description"],
        },
        { model: Category, as: "category", attributes: ["id", "name"] },
        { model: Kebele, as: "kebele", attributes: ["id", "name"] },
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
      lang === "all"
        ? emergency.toJSON()
        : localizeEmergency(emergency, lang);

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

// =========================
// UPDATE EMERGENCY STATUS
// =========================
const updateEmergencyStatus = async (
  emergencyId,
  status,
  report = null
) => {
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
      {
        model: EmergencyType,
        as: "emergencyType",
        attributes: ["id", "name"],
      },
      { model: Category, as: "category", attributes: ["id", "name"] },
      { model: Kebele, as: "kebele", attributes: ["id", "name"] },
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