const { Service, ServiceType, ServiceCategory, User } = require("../models");

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

module.exports = {
  createService,
  updateService,
  getAllServices,
  getServicesByType,
  getServicesByUser,
  deleteService,
};
