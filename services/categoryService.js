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

module.exports = {
  createCategory,
  deleteCategory,
  getAllCategories,
  getCategoriesByEmergencyType,
};
