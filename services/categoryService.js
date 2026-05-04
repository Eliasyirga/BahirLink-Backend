const { Category, EmergencyType } = require("../models");

const createCategory = async (data) => {
  // 1. Validate EmergencyType exists
  const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);
  if (!emergencyType) {
    throw new Error("EmergencyType not found");
  }

  // 2. FIXED: uniqueness per EmergencyType
  const existingCategory = await Category.findOne({
    where: {
      name: data.name,
      emergencyTypeId: data.emergencyTypeId,
    },
  });

  if (existingCategory) {
    throw new Error("Category already exists in this EmergencyType");
  }

  // 3. Create category
  const category = await Category.create({
    name: data.name,
    emergencyTypeId: data.emergencyTypeId,
  });

  // 4. ADD type for dashboard (NOT stored in DB)
  return {
    id: category.id,
    name: category.name,
    emergencyTypeId: category.emergencyTypeId,
    type: emergencyType.name, // 👈 dashboard display field
  };
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  await category.destroy();
  return { message: "Category deleted successfully" };
};

const getAllCategories = async () => {
  const categories = await Category.findAll({
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
  });

  // ADD type for dashboard
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emergencyTypeId: cat.emergencyTypeId,
    emergencyType: cat.emergencyType,
    type: cat.emergencyType.name, // 👈 dashboard display
  }));
};

const getCategoriesByEmergencyType = async (emergencyTypeId) => {
  const categories = await Category.findAll({
    where: { emergencyTypeId },
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
    order: [["name", "ASC"]],
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emergencyTypeId: cat.emergencyTypeId,
    type: cat.emergencyType.name,
  }));
};

const updateCategory = async (categoryId, data) => {
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  // validate emergencyType if changing
  if (data.emergencyTypeId) {
    const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);

    if (!emergencyType) {
      throw new Error("EmergencyType not found");
    }
  }

  // duplicate check
  if (data.name) {
    const existingCategory = await Category.findOne({
      where: {
        name: data.name,
        emergencyTypeId: data.emergencyTypeId ?? category.emergencyTypeId,
      },
    });

    if (existingCategory && existingCategory.id !== category.id) {
      throw new Error("Category already exists in this EmergencyType");
    }
  }

  await category.update({
    name: data.name ?? category.name,
    emergencyTypeId: data.emergencyTypeId ?? category.emergencyTypeId,
  });

  const updatedEmergencyType = await EmergencyType.findByPk(
    category.emergencyTypeId,
  );

  return {
    id: category.id,
    name: category.name,
    emergencyTypeId: category.emergencyTypeId,
    type: updatedEmergencyType.name, // 👈 dashboard display
  };
};

const getCategoriesByAgencyId = async (agencyId) => {
  const { Agency, AgencyType } = require("../models");

  // 1. Fetch the agency with its type
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  // 2. Map agency type → emergency type name (mirrors your emergency service)
  const agencyTypeToEmergencyType = {
    Police: "Crime",
    Health: "Health",
    Fire: "Fire",
    Ambulance: "Health",
  };

  const targetEmergencyTypeName = agencyTypeToEmergencyType[agencyTypeName];
  if (!targetEmergencyTypeName)
    throw new Error(`No emergency type mapped for agency type: ${agencyTypeName}`);

  // 3. Find the matching EmergencyType record
  const emergencyType = await EmergencyType.findOne({
    where: { name: targetEmergencyTypeName },
  });

  if (!emergencyType)
    throw new Error(`EmergencyType "${targetEmergencyTypeName}" not found in DB`);

  // 4. Fetch categories for that emergency type
  const categories = await Category.findAll({
    where: { emergencyTypeId: emergencyType.id },
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
    order: [["name", "ASC"]],
  });

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emergencyTypeId: cat.emergencyTypeId,
    emergencyType: cat.emergencyType,
    type: cat.emergencyType.name,
  }));
};

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  getCategoriesByAgencyId,
  updateCategory,
};
