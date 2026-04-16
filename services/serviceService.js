const { Service, ServiceType, ServiceCategory, User } = require("../models");

// ✅ CREATE SERVICE
const createService = async (data, userIdFromParams) => {
  // Ensure location data is converted to Floats from Multipart Strings
  const locationData =
    data.latitude && data.longitude
      ? {
          latitude: parseFloat(data.latitude),
          longitude: parseFloat(data.longitude),
        }
      : data.location;

  const service = await Service.create({
    name: data.name || "Service Request",
    description: data.description,

    // Convert Multipart strings to Numbers
    kebeleId: data.kebeleId ? parseInt(data.kebeleId) : null,
    serviceTypeId: data.serviceTypeId ? parseInt(data.serviceTypeId) : null,
    serviceCategoryId: data.serviceCategoryId
      ? parseInt(data.serviceCategoryId)
      : null,
    citizenId: parseInt(userIdFromParams || data.citizenId),

    subdivision: data.subdivision,
    street: data.street,
    location: locationData,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType,
    status: "pending",
    time: data.time,
  });

  return await Service.findByPk(service.id, {
    include: [{ model: ServiceType }, { model: ServiceCategory }],
  });
};

// ✅ UPDATE SERVICE
const updateService = async (serviceId, updates) => {
  // If updates come from a multipart form, parse IDs if they exist
  const processedUpdates = { ...updates };
  if (updates.serviceTypeId)
    processedUpdates.serviceTypeId = parseInt(updates.serviceTypeId);
  if (updates.serviceCategoryId)
    processedUpdates.serviceCategoryId = parseInt(updates.serviceCategoryId);

  const [rowsUpdated, updatedServices] = await Service.update(
    processedUpdates,
    {
      where: { id: serviceId },
      returning: true,
    },
  );

  if (rowsUpdated === 0) throw new Error("Service not found");

  return await Service.findByPk(serviceId, {
    include: [ServiceType, ServiceCategory],
  });
};

// ✅ GET ALL SERVICES
const getAllServices = async () => {
  return await Service.findAll({
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      // Note: Make sure the association name in your model matches "User" or "Citizen"
      { model: User, as: "citizen", attributes: ["id", "fullName", "email"] },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET SERVICES BY SERVICE TYPE
const getServicesByType = async (serviceTypeId) => {
  return await Service.findAll({
    where: { serviceTypeId: parseInt(serviceTypeId) },
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      { model: User, as: "citizen", attributes: ["id", "fullName", "email"] },
    ],
  });
};

// ✅ GET SERVICES BY USER (citizenId)
const getServicesByUser = async (citizenId) => {
  return await Service.findAll({
    where: { citizenId: parseInt(citizenId) },
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      { model: User, as: "citizen", attributes: ["id", "fullName", "email"] },
    ],
  });
};

// ✅ DELETE SERVICE
const deleteService = async (serviceId) => {
  const service = await Service.findByPk(serviceId);
  if (!service) throw new Error("Service not found");

  await service.destroy();
  return true;
};

module.exports = {
  createService,
  updateService,
  getAllServices,
  getServicesByType,
  getServicesByUser,
  deleteService,
};
