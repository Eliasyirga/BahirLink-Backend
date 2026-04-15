const Category = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");

// ✅ CREATE CATEGORY
const createCategory = async ({ name, description, serviceTypeId }) => {
  // Make sure the ServiceType exists
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  const category = await Category.create({ name, description, serviceTypeId });
  return category;
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async () => {
  const categories = await Category.findAll({
    include: [
      {
        model: ServiceType,
        attributes: ["id", "name"],
      },
    ],
  });
  return categories;
};

// ✅ GET CATEGORY BY ID
const getCategoryById = async (categoryId) => {
  const category = await Category.findByPk(categoryId, {
    include: [
      {
        model: ServiceType,
        attributes: ["id", "name"],
      },
    ],
  });
  if (!category) throw new Error("Category not found");
  return category;
};

// ✅ UPDATE CATEGORY
const updateCategory = async (categoryId, updates) => {
  if (updates.serviceTypeId) {
    const serviceType = await ServiceType.findByPk(updates.serviceTypeId);
    if (!serviceType) throw new Error("ServiceType not found");
  }

  const [_, updatedCategories] = await Category.update(updates, {
    where: { id: categoryId },
    returning: true,
  });

  if (!updatedCategories[0]) throw new Error("Category not found");
  return updatedCategories[0];
};

// ✅ DELETE CATEGORY
const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  await category.destroy();
  return true;
};
const getCategoriesByServiceType = async (serviceTypeId) => {
  // Check if the service type exists first (Optional, but good for error handling)
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  const categories = await Category.findAll({
    where: { serviceTypeId: serviceTypeId },
    include: [
      {
        model: ServiceType,
        attributes: ["id", "name"],
      },
    ],
    // Optional: Sort alphabetically
    order: [["name", "ASC"]],
  });

  return categories;
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByServiceType,
};
