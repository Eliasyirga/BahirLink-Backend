const { ServiceType, ServiceCategory } = require("../models");
const { sequelize } = require("../config/db");

// ✅ CREATE
const createServiceType = async (data) => {
  // Check if a ServiceType with the same English name already exists
  const englishName = typeof data.name === 'object' ? data.name.en : data.name;

  const existing = await ServiceType.findOne({
    where: sequelize.json("name.en", englishName),
  });

  if (existing) {
    throw new Error("Service type with this English name already exists");
  }

  // Ensure data is structured for JSONB before creation
  const processedData = {
    ...data,
    name: typeof data.name === 'string' ? { en: data.name, am: "" } : data.name,
    description: typeof data.description === 'string' ? { en: data.description, am: "" } : data.description,
  };

  return await ServiceType.create(processedData);
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

  // Check for name uniqueness in the English field if name is being updated
  if (data.name) {
    const englishName = typeof data.name === 'object' ? data.name.en : data.name;

    const existing = await ServiceType.findOne({
      where: sequelize.json("name.en", englishName),
    });

    if (existing && existing.id !== parseInt(id)) {
      throw new Error("Service type name already in use");
    }
  }

  // Handle deep merging for JSONB updates to avoid wiping out the other language
  const finalUpdates = { ...data };
  if (data.name && typeof data.name === 'object') {
    finalUpdates.name = { ...serviceType.name, ...data.name };
  }
  if (data.description && typeof data.description === 'object') {
    finalUpdates.description = { ...serviceType.description, ...data.description };
  }

  await serviceType.update(finalUpdates);
  return serviceType;
};

// ✅ DELETE
const deleteServiceType = async (id) => {
  const serviceType = await ServiceType.findByPk(id);

  if (!serviceType) {
    throw new Error("Service type not found");
  }

  await serviceType.destroy();
  return { success: true, message: "Service type deleted successfully" };
};

module.exports = {
  createServiceType,
  getAllServiceTypes,
  getServiceTypeById,
  updateServiceType,
  deleteServiceType,
};