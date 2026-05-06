const ServiceType = require("../models/ServiceType");
const ServiceCategory = require("../models/ServiceCategory");

// ✅ CREATE
const createServiceType = async (data) => {
  const existing = await ServiceType.findOne({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("Service type already exists");
  }

  return await ServiceType.create(data);
};

// ✅ GET ALL
const getAllServiceTypes = async () => {
  return await ServiceType.findAll({
    // Nest the associated ServiceCategory model
    include: [
      {
        model: ServiceCategory,
        as: "categories",
      },
    ],
    order: [["createdAt", "DESC"]],
  });
};

// ✅ GET BY ID
const getServiceTypeById = async (id) => {
  const serviceType = await ServiceType.findByPk(id);

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  return serviceType;
};

// ✅ UPDATE
const updateServiceType = async (id, data) => {
  const serviceType = await ServiceType.findByPk(id);

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  if (data.name) {
    const existing = await ServiceType.findOne({
      where: { name: data.name },
    });

    if (existing && existing.id !== id) {
      throw new Error("Service type name already in use");
    }
  }

  await serviceType.update(data);
  return serviceType;
};

// ✅ DELETE
const deleteServiceType = async (id) => {
  const serviceType = await ServiceType.findByPk(id);

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  await serviceType.destroy();

  return { message: "Service type deleted successfully" };
};

module.exports = {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};
