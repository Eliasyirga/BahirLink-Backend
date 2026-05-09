const { Op } = require("sequelize"); // Ensure Op is imported
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

const parseJsonField = (field) => {
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch (e) {
      return field; // Return as is if it's not JSON
    }
  }
  return field;
};

/**
 * REUSABLE INCLUDE CONFIG
 */
const serviceIncludes = [
  {
    model: ServiceType,
    as: "serviceType",
    attributes: ["id", "name"],
  },
  {
    model: ServiceCategory,
    as: "serviceCategory",
    attributes: ["id", "name"],
  },
  {
    model: User,
    as: "citizen",
    attributes: ["id", "fullName", "email"],
  },
];

// ✅ CREATE SERVICE
const createService = async (data, userIdFromParams, file) => {
  let mediaUrl = null;

  if (file && file.filename) {
    mediaUrl = `/uploads/${file.filename}`;
  }

  // Parse IDs safely
  const serviceTypeId = data.serviceTypeId
    ? parseInt(data.serviceTypeId)
    : null;
  const serviceCategoryId = data.serviceCategoryId
    ? parseInt(data.serviceCategoryId)
    : null;
  const citizenId = parseInt(userIdFromParams || data.citizenId);

  // Parse Location safely
  let finalLocation = data.location;
  if (data.latitude && data.longitude) {
    finalLocation = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
    };
  }

  const timestamp = Date.now();

  const processedName =
    typeof data.name === "string"
      ? { en: `${data.name} (${timestamp})`, am: `${data.name}` }
      : data.name || {
          en: `Service Request ${timestamp}`,
          am: `የአገልግሎት ጥያቄ ${timestamp}`,
        };

  const processedDescription =
    typeof data.description === "string"
      ? { en: data.description, am: "" }
      : data.description || { en: "", am: "" };

  const processedSubdivision =
    typeof data.subdivision === "string"
      ? { en: data.subdivision, am: "" }
      : data.subdivision || { en: "", am: "" };

  const processedStreet =
    typeof data.street === "string"
      ? { en: data.street, am: "" }
      : data.street || { en: "", am: "" };

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
    mediaUrl: mediaUrl,
    mediaType: data.mediaType || (file ? "photo" : null),
    status: "pending",
    time: data.time || new Date().toLocaleTimeString("it-IT"),
  });

  return await Service.findByPk(service.id, {
    include: serviceIncludes,
  });
};

// ✅ UPDATE SERVICE
const updateService = async (serviceId, updates) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");

  const finalUpdates = { ...updates };

  if (updates.name && typeof updates.name === "object") {
    finalUpdates.name = { ...service.name, ...updates.name };
  }
  if (updates.description && typeof updates.description === "object") {
    finalUpdates.description = {
      ...service.description,
      ...updates.description,
    };
  }

  await service.update(finalUpdates);

  return await Service.findByPk(serviceId, {
    include: serviceIncludes,
  });
};

// ✅ GET ALL SERVICES
// ✅ GET ALL SERVICES (English Only)
const getAllServices = async () => {
  const services = await Service.findAll({
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
  });

  return services.map((s) => {
    const item = s.get({ plain: true });

    /**
     * Helper to extract English string or first available translation
     */
    const toEnglish = (field) => {
      const parsed = parseJsonField(field);
      if (!parsed || typeof parsed !== "object") return parsed;
      return parsed["en"] || Object.values(parsed)[0] || "";
    };

    return {
      ...item,
      name: toEnglish(item.name),
      description: toEnglish(item.description),
      subdivision: toEnglish(item.subdivision),
      street: toEnglish(item.street),
      serviceType: item.serviceType
        ? {
            ...item.serviceType,
            name: toEnglish(item.serviceType.name),
          }
        : null,
      serviceCategory: item.serviceCategory
        ? {
            ...item.serviceCategory,
            name: toEnglish(item.serviceCategory.name),
          }
        : null,
    };
  });
};

// ✅ GET SERVICES BY SERVICE TYPE
const getServicesByType = async (serviceTypeId) => {
  return await Service.findAll({
    where: { serviceTypeId: parseInt(serviceTypeId) },
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET SERVICES BY USER
const getServicesByUser = async (citizenId) => {
  const parsedId = parseInt(citizenId);
  if (isNaN(parsedId)) throw new Error("Invalid User ID provided");

  return await Service.findAll({
    where: { citizenId: parsedId },
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
  });
};

// ✅ DELETE SERVICE
const deleteService = async (serviceId) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");

  await service.destroy();
  return { success: true, message: "Service deleted successfully" };
};

// ✅ GET SERVICES BY AGENCY
const getServicesByAgency = async (agencyId) => {
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

  // 1. Fetch the raw services
  const services = await Service.findAll({
    where: { serviceTypeId: serviceType.id },
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
  });

  // 2. Helper to peel back extra stringification layers
  const cleanJson = (val) => {
    if (typeof val !== "string") return val;
    try {
      const parsed = JSON.parse(val);
      // If it was double-stringified, parse it one more time
      return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
    } catch {
      return val;
    }
  };

  // 3. Map and clean every service before returning to the controller
  return services.map((s) => {
    const item = s.get({ plain: true });
    return {
      ...item,
      name: cleanJson(item.name),
      description: cleanJson(item.description),
      subdivision: cleanJson(item.subdivision),
      street: cleanJson(item.street),
      // Also clean the category name if it exists
      serviceCategory: item.serviceCategory
        ? {
            ...item.serviceCategory,
            name: cleanJson(item.serviceCategory.name),
          }
        : null,
    };
  });
};
// ✅ GET SERVICES FOR RESPONDER TEAM (English Only)
const getServicesForResponderTeam = async (responderTeamId) => {
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

  // Determine the Agency Type Name (Internal logic still uses 'en' for matching)
  const agencyTypeName =
    typeof team.agency.agencyType?.name === "object"
      ? team.agency.agencyType.name.en
      : team.agency.agencyType?.name;

  // Find matching ServiceType using JSONB query
  const serviceType = await ServiceType.findOne({
    where: sequelize.where(sequelize.json("name.en"), agencyTypeName),
  });

  if (!serviceType) return [];

  const services = await Service.findAll({
    where: {
      serviceTypeId: serviceType.id,
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
            through: {
              model: ResponderTeamKebele,
              attributes: [],
            },
          },
        ],
      },
      ...serviceIncludes,
    ],
    order: [["createdAt", "DESC"]],
  });

  // Flatten the response to return ONLY English strings
  return services.map((s) => {
    const item = s.get({ plain: true });

    /**
     * Internal Helper: Always prioritize 'en'.
     * If 'en' is missing, it falls back to the first available string
     * to prevent the dashboard from appearing empty.
     */
    const toEnglish = (field) => {
      const parsed = parseJsonField(field);
      if (!parsed || typeof parsed !== "object") return parsed;
      return parsed["en"] || Object.values(parsed)[0] || "";
    };

    return {
      ...item,
      name: toEnglish(item.name),
      description: toEnglish(item.description),
      subdivision: toEnglish(item.subdivision),
      street: toEnglish(item.street),
      serviceType: item.serviceType
        ? {
            ...item.serviceType,
            name: toEnglish(item.serviceType.name),
          }
        : null,
      serviceCategory: item.serviceCategory
        ? {
            ...item.serviceCategory,
            name: toEnglish(item.serviceCategory.name),
          }
        : null,
      kebele: item.kebele
        ? {
            ...item.kebele,
            name: toEnglish(item.kebele.name),
          }
        : null,
    };
  });
};

module.exports = {
  createService,
  updateService,
  getAllServices,
  getServicesByType,
  getServicesByUser,
  deleteService,
  getServicesByAgency,
  getServicesForResponderTeam,
};
