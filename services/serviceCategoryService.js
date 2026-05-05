const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");
const { Agency, AgencyType } = require("../models"); // Import related models

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

// In your serviceCategoryService.js
const getCategoriesByAgencyId = async (agencyId) => {
  // 1. Fetch the agency with its type
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  // Get the name (e.g., "Municipal", "Electric", "Water")
  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  // 2. Find the matching ServiceType record
  // This assumes your ServiceType table has entries like "Municipal" or "Water"
  const serviceType = await ServiceType.findOne({
    where: { name: agencyTypeName },
  });

  if (!serviceType) {
    // If no match is found, we log it and return empty to prevent the frontend from crashing
    console.warn(
      `⚠️ No ServiceType found in database matching AgencyType: "${agencyTypeName}"`,
    );
    return [];
  }

  // 3. Fetch categories belonging to that ServiceType
  const categories = await ServiceCategory.findAll({
    where: { serviceTypeId: serviceType.id },
    include: [
      {
        model: ServiceType,
        as: "serviceType",
        attributes: ["id", "name"],
      },
    ],
    order: [["name", "ASC"]],
  });

  // 4. Map the data to the format your frontend expects
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    serviceTypeId: cat.serviceTypeId,
    type: cat.serviceType?.name, // This allows the UI to display the type name
  }));
};

module.exports = {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  getCategoriesByServiceType,
  getCategoriesByAgencyId,
};
