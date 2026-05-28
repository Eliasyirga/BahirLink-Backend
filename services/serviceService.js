const { Op } = require("sequelize");
const {
  Service,
  ServiceType,
  ServiceCategory,
  User,
  Agency,
  AgencyType,
  ResponderTeam,
  Kebele,
  ResponderTeamKebele,
} = require("../models");
const { sequelize } = require("../config/db");
const translate = require("google-translate-api-x");

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
      required: false,
    },
  ],
};

const serviceIncludes = [
  { model: ServiceType, as: "serviceType", attributes: ["id", "name"] },
  { model: ServiceCategory, as: "serviceCategory", attributes: ["id", "name"] },
  { model: User, as: "citizen", attributes: ["id", "fullName", "email"] },
];

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
 * Parse a field that may be a double-stringified JSON object.
 */
const parseJsonField = (field) => {
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return field;
    }
  }
  return field;
};

/**
 * Resolve a single field value to a locale string.
 * FIX: extracted as a standalone helper used inside localizeService so the
 *      logic is consistent and fields that are already plain strings (already
 *      localized by a prior call) are returned as-is without modification.
 */
const resolveLocale = (value, lang) => {
  if (value == null) return value;

  // Already a plain string — backend already localized it upstream.
  if (typeof value === "string") return value;

  const parsed = parseJsonField(value);
  if (parsed && typeof parsed === "object") {
    return parsed[lang] || parsed["en"] || Object.values(parsed)[0] || "";
  }
  return String(value);
};

/**
 * Localize a plain service object for a specific language.
 */
const localizeService = (
  item,
  lang,
  fields = ["name", "description", "subdivision", "street"],
) => {
  if (!item) return null;
  const plain =
    typeof item.get === "function" ? item.get({ plain: true }) : { ...item };

  fields.forEach((field) => {
    if (plain[field] != null) {
      plain[field] = resolveLocale(plain[field], lang);
    }
  });

  // FIX: use resolveLocale for nested objects to handle both bilingual maps
  //      and fields that are already plain strings (e.g. from a cached call).
  const flattenNested = (obj) => {
    if (!obj) return;
    ["name", "description"].forEach((f) => {
      if (obj[f] != null) {
        obj[f] = resolveLocale(obj[f], lang);
      }
    });
  };

  flattenNested(plain.serviceType);
  flattenNested(plain.serviceCategory);
  flattenNested(plain.kebele);

  // Localize team names inside kebele.teams
  if (Array.isArray(plain.kebele?.teams)) {
    plain.kebele.teams = plain.kebele.teams.map((t) => ({
      ...t,
      name: resolveLocale(t.name, lang),
    }));
  }

  return plain;
};

// =========================
// CREATE SERVICE
// =========================
const createService = async (data, userIdFromParams, file) => {
  // UPDATED: Destructure cloud paths from Multer configuration streams
  let mediaUrl = null;
  let mediaPublicId = null;

  if (file) {
    mediaUrl = file.path;
    mediaPublicId = file.filename;
  }

  const serviceTypeId = data.serviceTypeId
    ? parseInt(data.serviceTypeId)
    : null;
  const serviceCategoryId = data.serviceCategoryId
    ? parseInt(data.serviceCategoryId)
    : null;
  const citizenId = parseInt(userIdFromParams || data.citizenId);

  let finalLocation = data.location;
  if (data.latitude && data.longitude) {
    finalLocation = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
    };
  }

  const processedName = await autoTranslate(data.name || `Service Request`);
  const processedDescription = await autoTranslate(data.description || "");
  const processedSubdivision = await autoTranslate(data.subdivision || "");
  const processedStreet = await autoTranslate(data.street || "");

  const service = await Service.create({
    name: processedName,
    description: processedDescription,
    subdivision: processedSubdivision,
    street: processedStreet,
    kebeleId: data.kebeleId ? parseInt(data.kebeleId) : null,
    serviceTypeId,
    serviceCategoryId,
    citizenId,
    location: finalLocation,
    mediaUrl,
    mediaPublicId, // Tracking attribute safely injected
    mediaType:
      data.mediaType ||
      (file ? (file.mimetype?.startsWith("video") ? "video" : "photo") : null),
    status: "pending",
    time: data.time || new Date().toLocaleTimeString("it-IT"),
  });

  return await Service.findByPk(service.id, { include: serviceIncludes });
};

const updateService = async (serviceId, updates, file) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");

  const finalUpdates = { ...updates };

  if (updates.name) finalUpdates.name = await autoTranslate(updates.name);
  if (updates.description)
    finalUpdates.description = await autoTranslate(updates.description);
  if (updates.subdivision)
    finalUpdates.subdivision = await autoTranslate(updates.subdivision);
  if (updates.street) finalUpdates.street = await autoTranslate(updates.street);

  // UPDATED: Clean local references inside dynamic asset updates
  if (file) {
    finalUpdates.mediaUrl = file.path;
    finalUpdates.mediaPublicId = file.filename;
    finalUpdates.mediaType = file.mimetype?.startsWith("video")
      ? "video"
      : "photo";
  }

  await service.update(finalUpdates);
  return await Service.findByPk(serviceId, { include: serviceIncludes });
};

const getAllServices = async (lang = "en") => {
  const services = await Service.findAll({
    include: [...serviceIncludes, kebeleWithTeams],
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return services;

  return services.map((s) => {
    // Localize relational objects using your core utility
    const localized = localizeService(s, lang);
    const plainService =
      typeof localized.get === "function"
        ? localized.get({ plain: true })
        : localized;

    // Helper to safely unpack nested JSON strings for core string text fields
    const unpackField = (field) => {
      if (!field) return "";
      let val = field;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            val = JSON.parse(trimmed);
          } catch (e) {
            return val;
          }
        }
      }
      if (typeof val === "object" && val !== null) {
        return val[lang] || val["en"] || "";
      }
      return String(val);
    };

    return {
      ...plainService,
      name: unpackField(plainService.name),
      description: unpackField(plainService.description),
      subdivision: unpackField(plainService.subdivision),
    };
  });
};

// =========================
// GET SERVICES BY TYPE
// =========================
const getServicesByType = async (serviceTypeId, lang = "en") => {
  const services = await Service.findAll({
    where: { serviceTypeId: parseInt(serviceTypeId) },
    include: [...serviceIncludes, kebeleWithTeams],
    order: [["createdAt", "DESC"]],
  });

  if (lang === "all") return services;

  return services.map((s) => {
    // Localize relational objects using your core utility
    const localized = localizeService(s, lang);
    const plainService =
      typeof localized.get === "function"
        ? localized.get({ plain: true })
        : localized;

    // Helper to safely unpack nested JSON strings for core string text fields
    const unpackField = (field) => {
      if (!field) return "";
      let val = field;
      if (typeof val === "string") {
        const trimmed = val.trim();
        if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
          try {
            val = JSON.parse(trimmed);
          } catch (e) {
            return val;
          }
        }
      }
      if (typeof val === "object" && val !== null) {
        return val[lang] || val["en"] || "";
      }
      return String(val);
    };

    return {
      ...plainService,
      name: unpackField(plainService.name),
      description: unpackField(plainService.description),
      subdivision: unpackField(plainService.subdivision),
    };
  });
};

// =========================
// GET SERVICES BY USER
// =========================

const getServicesByUser = async (citizenId, lang = "en") => {
  const parsedId = parseInt(citizenId);
  if (isNaN(parsedId)) throw new Error("Invalid User ID provided");

  const services = await Service.findAll({
    where: { citizenId: parsedId },
    include: [...serviceIncludes, kebeleWithTeams],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? services
    : services.map((s) => localizeService(s, lang));
};

// =========================
// DELETE SERVICE
// =========================
const deleteService = async (serviceId) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");
  await service.destroy();
  return { success: true, message: "Service deleted successfully" };
};

// =========================
// GET SERVICES BY AGENCY
// =========================
const getServicesByAgency = async (agencyId, lang = "en") => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });
  if (!agency) throw new Error("Agency not found");

  const agencyTypeName =
    typeof agency.agencyType?.name === "object"
      ? agency.agencyType.name.en
      : agency.agencyType?.name;

  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  const searchTerm = agencyTypeName.toLowerCase().trim();

  const serviceType = await ServiceType.findOne({
    where: {
      [Op.or]: [
        sequelize.where(
          sequelize.fn("LOWER", sequelize.json("name.en")),
          searchTerm,
        ),
        sequelize.where(
          sequelize.fn(
            "LOWER",
            sequelize.cast(sequelize.col("ServiceType.name"), "text"),
          ),
          { [Op.like]: `%${searchTerm}%` },
        ),
      ],
    },
  });

  if (!serviceType) {
    console.log(`❌ No ServiceType found matching: ${searchTerm}`);
    return [];
  }

  const services = await Service.findAll({
    where: { serviceTypeId: serviceType.id },
    include: [...serviceIncludes, kebeleWithTeams],
    order: [["createdAt", "DESC"]],
  });

  return lang === "all"
    ? services
    : services.map((s) => localizeService(s, lang));
};

// =========================
// GET SERVICES FOR RESPONDER TEAM
// =========================
const getServicesForResponderTeam = async (responderTeamId, lang = "en") => {
  const team = await ResponderTeam.findByPk(responderTeamId, {
    include: [
      {
        model: Agency,
        as: "agency",
        include: [{ model: AgencyType, as: "agencyType" }],
      },
    ],
  });
  if (!team) throw new Error("Responder Team not found");

  // Dynamically uses 'lang' (defaults to 'en') to pull the correct agency type string
  const agencyTypeName =
    typeof team.agency.agencyType?.name === "object"
      ? team.agency.agencyType.name[lang]
      : team.agency.agencyType?.name;

  // Dynamically queries the database path (e.g., name.en or name.am) based on 'lang'
  const serviceType = await ServiceType.findOne({
    where: sequelize.where(sequelize.json(`name.${lang}`), agencyTypeName),
  });
  if (!serviceType) return [];

  const services = await Service.findAll({
    where: { serviceTypeId: serviceType.id },
    subQuery: false,
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
            through: { model: ResponderTeamKebele, attributes: [] },
          },
        ],
      },
      ...serviceIncludes,
    ],
    order: [["createdAt", "DESC"]],
  });

  return services.map((s) => {
    const item = s.get({ plain: true });
    return {
      ...item,
      name: resolveLocale(item.name, lang),
      description: resolveLocale(item.description, lang),
      subdivision: resolveLocale(item.subdivision, lang),
      street: resolveLocale(item.street, lang),
      serviceType: item.serviceType
        ? {
            ...item.serviceType,
            name: resolveLocale(item.serviceType.name, lang),
          }
        : null,
      serviceCategory: item.serviceCategory
        ? {
            ...item.serviceCategory,
            name: resolveLocale(item.serviceCategory.name, lang),
          }
        : null,
      kebele: item.kebele
        ? {
            ...item.kebele,
            name: resolveLocale(item.kebele.name, lang),
            teams: (item.kebele.teams || []).map((t) => ({
              ...t,
              name: resolveLocale(t.name, lang),
            })),
          }
        : null,
    };
  });
};

// =========================
// GET ALL SERVICES FOR ADMIN
// =========================
const getAllServicesForAdmin = async (lang = "en") => {
  try {
    const services = await Service.findAll({
      include: [...serviceIncludes, kebeleWithTeams],
      order: [["createdAt", "DESC"]],
    });

    return services.map((s) => {
      // 1. Core localization extraction helper
      const localized =
        lang === "all" ? s.get({ plain: true }) : localizeService(s, lang);

      // 2. BACKEND SAFETY NET: Inline parse double-stringified objects if present
      const parseField = (field) => {
        if (!field) return "";
        let current = field;

        // If it arrives as an escaped text string, parse it to a true object
        if (typeof current === "string") {
          try {
            current = JSON.parse(current);
          } catch (e) {
            return current; // Not JSON, return plain string fallback
          }
        }

        // Extract target language value safely
        if (typeof current === "object" && current !== null) {
          return current[lang] || current["en"] || "";
        }
        return String(current);
      };

      const assignedTeam = localized.kebele?.teams?.[0] || null;

      return {
        id: localized.id,
        // Apply the safe extraction filter directly to main database properties
        name: parseField(localized.name),
        description: parseField(localized.description),
        subdivision: parseField(localized.subdivision),
        street: localized.street,
        serviceType: resolveLocale(localized.serviceType?.name, lang) || null,
        serviceCategory:
          resolveLocale(localized.serviceCategory?.name, lang) || null,
        kebele: resolveLocale(localized.kebele?.name, lang) || null,
        kebeleData: localized.kebele || null,
        assignedStation: assignedTeam
          ? {
              id: assignedTeam.id,
              name: resolveLocale(assignedTeam.name, lang),
              kebele: resolveLocale(localized.kebele?.name, lang) || null,
            }
          : null,
        reporterName: localized.citizen?.fullName || "Registered User",
        status: localized.status,
        createdAt: localized.createdAt,
      };
    });
  } catch (err) {
    console.error("❌ Error in getAllServicesForAdmin:", err);
    throw err;
  }
};

// =========================
// GET SINGLE SERVICE BY ID
// =========================
const getServiceById = async (id, lang = "en") => {
  try {
    const service = await Service.findByPk(id, {
      include: [...serviceIncludes, kebeleWithTeams],
    });
    if (!service) return null;

    const base =
      lang === "all" ? service.toJSON() : localizeService(service, lang);

    return {
      ...base,
      reporterName: service.citizen?.fullName || "Registered User",
      location:
        typeof base.location === "string"
          ? JSON.parse(base.location)
          : base.location,
    };
  } catch (err) {
    console.error("❌ Error in getServiceById:", err);
    throw err;
  }
};

// =========================
// UPDATE SERVICE STATUS
// =========================
const updateServiceStatus = async (serviceId, status, report = null) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service record not found in database");
  service.status = status;
  if (report) service.report = report;
  return await service.save();
};

module.exports = {
  createService,
  updateService,
  getAllServices,
  getAllServicesForAdmin,
  getServiceById,
  getServicesByType,
  getServicesByUser,
  deleteService,
  getServicesByAgency,
  getServicesForResponderTeam,
  updateServiceStatus,
};
