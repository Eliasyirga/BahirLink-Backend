const {
  Service,
  ServiceType,
  ServiceCategory,
  User,
  Agency,
  AgencyType,
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
  const serviceTypeId = data.serviceTypeId ? parseInt(data.serviceTypeId) : null;
  const serviceCategoryId = data.serviceCategoryId ? parseInt(data.serviceCategoryId) : null;
  const citizenId = parseInt(userIdFromParams || data.citizenId);

  // Parse Location safely (Ensure it's an object for JSONB)
  let finalLocation = data.location;
  if (data.latitude && data.longitude) {
    finalLocation = {
      latitude: parseFloat(data.latitude),
      longitude: parseFloat(data.longitude),
    };
  }

  /**
   * ✅ MULTI-LANGUAGE HANDLING
   * Data coming from the frontend might be a string (from a form) 
   * or already an object. We ensure it's saved as { en, am }.
   */
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

  // Prevent direct overwrite of JSONB objects if only one language is sent
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

// ✅ GET SERVICES BY AGENCY (Multi-language aware)
const getServicesByAgency = async (agencyId) => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  // Agency names are likely strings or JSONB. We check both.
  const agencyTypeName = typeof agency.agencyType?.name === 'object' 
    ? agency.agencyType.name.en 
    : agency.agencyType?.name;

  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  /**
   * Note: If ServiceType.name is now JSONB, 
   * Sequelize requires specific syntax to search inside JSON
   */
  const serviceType = await ServiceType.findOne({
    where: sequelize.json("name.en", agencyTypeName)
  });

  if (!serviceType) {
    console.warn(`No ServiceType found matching AgencyType: ${agencyTypeName}`);
    return [];
  }

  return await Service.findAll({
    where: { serviceTypeId: serviceType.id },
    include: serviceIncludes,
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
};