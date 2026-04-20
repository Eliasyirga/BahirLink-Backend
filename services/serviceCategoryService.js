const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");

/**
 * REUSABLE INCLUDE CONFIG
 * Ensures consistency across all fetch functions
 */
const serviceTypeInclude = {
  model: ServiceType,
  as: "serviceType", // Ensure this matches your models/index.js association
  attributes: ["id", "name"],
};

// ✅ CREATE CATEGORY
const createCategory = async ({ name, description, serviceTypeId }) => {
  // Validate ServiceType exists
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  // Use ServiceCategory (not Category)
  const category = await ServiceCategory.create({
    name,
    description,
    serviceTypeId,
  });
  return category;
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async () => {
  return await ServiceCategory.findAll({
    include: [serviceTypeInclude],
    order: [["name", "ASC"]],
  });
};

// ✅ GET CATEGORY BY ID
const getCategoryById = async (categoryId) => {
  const category = await ServiceCategory.findByPk(categoryId, {
    include: [serviceTypeInclude],
  });
  if (!category) throw new Error("Category not found");
  return category;
};

// ✅ GET CATEGORIES BY SERVICE TYPE
const getCategoriesByServiceType = async (serviceTypeId) => {
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  return await ServiceCategory.findAll({
    where: { serviceTypeId },
    include: [serviceTypeInclude],
    order: [["name", "ASC"]],
  });
};

// ✅ UPDATE CATEGORY
const updateCategory = async (categoryId, updates) => {
  if (updates.serviceTypeId) {
    const serviceType = await ServiceType.findByPk(updates.serviceTypeId);
    if (!serviceType) throw new Error("ServiceType not found");
  }

  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  return await category.update(updates);
};

// ✅ DELETE CATEGORY
const deleteCategory = async (categoryId) => {
  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  await category.destroy();
  return { success: true, message: "Category deleted successfully" };
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByServiceType,
};
