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

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
  updateCategory,
};
