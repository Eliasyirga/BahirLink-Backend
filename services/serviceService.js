// services/serviceService.js
const { Service, ServiceType, ServiceCategory, User } = require("../models");

const createService = async (data, userIdFromParams) => {
  // Map coordinates to JSON if they exist in the request
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
    kebeleId: parseInt(data.kebeleId),
    subdivision: data.subdivision,
    street: data.street,
    location: locationData,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType,
    status: "pending",
    citizenId: userIdFromParams || data.citizenId,
    serviceTypeId: data.serviceTypeId,
    serviceCategoryId: data.serviceCategoryId,
    time: data.time,
  });

  return await Service.findByPk(service.id, {
    include: [ServiceType, ServiceCategory],
  });
};

// ✅ UPDATE SERVICE
const updateService = async (serviceId, updates) => {
  const [_, updatedServices] = await Service.update(updates, {
    where: { id: serviceId },
    returning: true,
  });

  if (!updatedServices[0]) throw new Error("Service not found");

  const result = await Service.findByPk(serviceId, {
    include: [ServiceType, ServiceCategory],
  });

  return result;
};

// ✅ GET ALL SERVICES
const getAllServices = async () => {
  const services = await Service.findAll({
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      { model: User, attributes: ["id", "fullName", "email"] },
    ],
  });

  return services;
};

// ✅ GET SERVICES BY SERVICE TYPE
const getServicesByType = async (serviceTypeId) => {
  const services = await Service.findAll({
    where: { serviceTypeId },
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      { model: User, attributes: ["id", "fullName", "email"] },
    ],
  });

  return services;
};

// ✅ GET SERVICES BY USER (citizenId)
const getServicesByUser = async (citizenId) => {
  const services = await Service.findAll({
    where: { citizenId },
    include: [
      { model: ServiceType },
      { model: ServiceCategory },
      { model: User, attributes: ["id", "fullName", "email"] },
    ],
  });

  return services;
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
