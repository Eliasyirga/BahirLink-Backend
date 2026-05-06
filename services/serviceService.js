const {
  Service,
  ServiceType,
  ServiceCategory,
  User,
  Agency,
  AgencyType,
  ResponderTeam, // Add this
  Kebele, // Add this
  ResponderTeamKebele, // Add this (since you use it on line 211)
} = require("../models");
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

  /**
   * ✅ FIX: Handling Unique Constraint on 'name'
   * To prevent the 'duplicate key' error, we append a timestamp
   * if a name is provided, or generate a unique default.
   */
  const uniqueName = data.name
    ? `${data.name} (${Date.now()})`
    : `Service Request ${Date.now()}`;

  const service = await Service.create({
    name: uniqueName,
    description: data.description,
    kebeleId: data.kebeleId ? parseInt(data.kebeleId) : null,
    serviceTypeId,
    serviceCategoryId,
    citizenId,
    subdivision: data.subdivision,
    street: data.street,
    location: finalLocation,
    mediaUrl: mediaUrl,
    mediaType: data.mediaType || (file ? "photo" : null),
    status: "pending",
    time: data.time || new Date().toLocaleTimeString("it-IT"), // Fallback to HH:mm:ss
  });

  // Return with associations
  return await Service.findByPk(service.id, {
    include: serviceIncludes,
  });
};

// ✅ UPDATE SERVICE
const updateService = async (serviceId, updates) => {
  const processedUpdates = { ...updates };

  if (updates.serviceTypeId)
    processedUpdates.serviceTypeId = parseInt(updates.serviceTypeId);
  if (updates.serviceCategoryId)
    processedUpdates.serviceCategoryId = parseInt(updates.serviceCategoryId);

  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");

  await service.update(processedUpdates);

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

const getServicesByAgency = async (agencyId) => {
  // 1. Fetch the agency with its type (e.g., "Municipal")
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  // 2. Find the matching ServiceType record (e.g., where name is "Municipal")
  const serviceType = await ServiceType.findOne({
    where: { name: agencyTypeName },
  });

  if (!serviceType) {
    console.warn(`No ServiceType found matching AgencyType: ${agencyTypeName}`);
    return []; // Return empty array so the dashboard doesn't crash
  }

  // 3. Fetch all services that belong to this ServiceType
  // This avoids looking for an agencyId column in the ServiceCategory table
  return await Service.findAll({
    where: { serviceTypeId: serviceType.id }, // Filter services by the mapped type
    include: [
      {
        model: ServiceCategory,
        as: "serviceCategory",
        attributes: ["id", "name"], // Removed 'agencyId' from attributes as it doesn't exist
      },
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id", "name"],
      },
      {
        model: User,
        as: "citizen",
        attributes: ["id", "fullName", "email"],
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

const getServicesForResponderTeam = async (responderTeamId) => {
  // 1. Find the team and their agency context
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

  // 2. Map AgencyType to ServiceType
  const agencyTypeName = team.agency.agencyType?.name;
  const serviceType = await ServiceType.findOne({
    where: { name: agencyTypeName },
  });

  if (!serviceType) return [];

  // 3. Fetch Services filtered by Type and Kebele Assignment
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
      ...serviceIncludes, // Reusing the top configuration
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
