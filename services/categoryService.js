const { Category, EmergencyType } = require("../models");

const createCategory = async (data) => {
  const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);
  if (!emergencyType) {
    throw new Error("EmergencyType not found");
  }

  const existingCategory = await Category.findOne({
    where: { name: data.name },
  });
  if (existingCategory) {
    throw new Error("Category with this name already exists");
  }

  const category = await Category.create({
    name: data.name,
    type: data.type,
    emergencyTypeId: data.emergencyTypeId,
  });

  return category;
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
    attributes: ["id", "name", "type"],
    include: {
      model: EmergencyType,
      as: "emergencyType",
      attributes: ["id", "name"],
    },
  });

  return categories;
};
const getCategoriesByEmergencyType = async (emergencyTypeId) => {
  const categories = await Category.findAll({
    where: { emergencyTypeId },
    attributes: ["id", "name", "type"],
    order: [["name", "ASC"]],
  });

  return categories;
};

const updateCategory = async (categoryId, data) => {
  // 1. Find category
  const category = await Category.findByPk(categoryId);

  if (!category) {
    throw new Error("Category not found");
  }

  // 2. If emergencyTypeId is changing, validate it
  if (data.emergencyTypeId) {
    const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);

    if (!emergencyType) {
      throw new Error("EmergencyType not found");
    }
  }

  // 3. If name is changing, check duplicates
  if (data.name && data.name !== category.name) {
    const existingCategory = await Category.findOne({
      where: { name: data.name },
    });

    if (existingCategory) {
      throw new Error("Category with this name already exists");
    }
  }

  // 4. Update fields
  await category.update({
    name: data.name ?? category.name,
    type: data.type ?? category.type,
    emergencyTypeId: data.emergencyTypeId ?? category.emergencyTypeId,
  });

  return category;
};

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
};
