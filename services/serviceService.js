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
  const serviceTypeId = data.serviceTypeId ? parseInt(data.serviceTypeId) : null;
  const serviceCategoryId = data.serviceCategoryId ? parseInt(data.serviceCategoryId) : null;
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
  
  const processedName = typeof data.name === 'string' 
    ? { en: `${data.name} (${timestamp})`, am: `${data.name}` }
    : data.name || { en: `Service Request ${timestamp}`, am: `የአገልግሎት ጥያቄ ${timestamp}` };

  const processedDescription = typeof data.description === 'string'
    ? { en: data.description, am: "" }
    : data.description || { en: "", am: "" };

  const processedSubdivision = typeof data.subdivision === 'string'
    ? { en: data.subdivision, am: "" }
    : data.subdivision || { en: "", am: "" };

  const processedStreet = typeof data.street === 'string'
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
  
  if (updates.name && typeof updates.name === 'object') {
    finalUpdates.name = { ...service.name, ...updates.name };
  }
  if (updates.description && typeof updates.description === 'object') {
    finalUpdates.description = { ...service.description, ...updates.description };
  }

  await service.update(finalUpdates);

  return await Service.findByPk(serviceId, {
    include: serviceIncludes,
  });
};

// ✅ GET ALL SERVICES
const getAllServices = async () => {
  return await Service.findAll({
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
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

  const agencyTypeName = typeof agency.agencyType?.name === 'object' 
    ? agency.agencyType.name.en 
    : agency.agencyType?.name;

  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  const serviceType = await ServiceType.findOne({
    where: sequelize.json("name.en", agencyTypeName)
  });

  if (!serviceType) return [];

  return await Service.findAll({
    where: { serviceTypeId: serviceType.id },
    include: serviceIncludes,
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET SERVICES FOR RESPONDER TEAM (Kebele & Type Aware)
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

  const agencyTypeName = typeof team.agency.agencyType?.name === 'object'
    ? team.agency.agencyType.name.en
    : team.agency.agencyType?.name;

  const serviceType = await ServiceType.findOne({
    where: sequelize.json("name.en", agencyTypeName),
  });

  if (!serviceType) return [];

  return await Service.findAll({
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