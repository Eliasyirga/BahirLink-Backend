const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");
const { Agency, AgencyType } = require("../models"); 
const { sequelize } = require("../config/db"); // Needed for JSON querying

const serviceTypeInclude = {
  model: ServiceType,
  as: "serviceType",
  attributes: ["id", "name"],
};

// ✅ CREATE CATEGORY
const createCategory = async ({ name, description, serviceTypeId }) => {
  // Validate ServiceType exists
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  // Logic Check: Avoid duplicate English names within the same ServiceType
  const englishName = typeof name === 'object' ? name.en : name;
  const existing = await ServiceCategory.findOne({
    where: {
      serviceTypeId,
      ...sequelize.json("name.en", englishName)
    }
  });
  if (existing) throw new Error("Category name already exists for this service type");

  // Structure data for JSONB
  const category = await ServiceCategory.create({
    name: typeof name === 'string' ? { en: name, am: "" } : name,
    description: typeof description === 'string' ? { en: description, am: "" } : description,
    serviceTypeId,
  });
  
  return category;
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async () => {
  return await ServiceCategory.findAll({
    include: [serviceTypeInclude],
    // Order by English name inside the JSONB
    order: [[sequelize.json("name.en"), "ASC"]],
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
    order: [[sequelize.json("name.en"), "ASC"]],
  });
};

// ✅ UPDATE CATEGORY
const updateCategory = async (categoryId, updates) => {
  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  if (updates.serviceTypeId) {
    const serviceType = await ServiceType.findByPk(updates.serviceTypeId);
    if (!serviceType) throw new Error("ServiceType not found");
  }

  // Deep Merge JSONB fields
  const finalUpdates = { ...updates };
  if (updates.name && typeof updates.name === 'object') {
    finalUpdates.name = { ...category.name, ...updates.name };
  }
  if (updates.description && typeof updates.description === 'object') {
    finalUpdates.description = { ...category.description, ...updates.description };
  }

  return await category.update(finalUpdates);
};

// ✅ DELETE CATEGORY
const deleteCategory = async (categoryId) => {
  const category = await ServiceCategory.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  await category.destroy();
  return { success: true, message: "Category deleted successfully" };
};

// ✅ GET CATEGORIES BY AGENCY ID (Localized)
const getCategoriesByAgencyId = async (agencyId) => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  // AgencyType name is now likely JSONB {en, am}
  const agencyTypeNameEn = typeof agency.agencyType?.name === 'object' 
    ? agency.agencyType.name.en 
    : agency.agencyType?.name;

  if (!agencyTypeNameEn) throw new Error("Agency has no type assigned");

  // Match the English name of the ServiceType
  const serviceType = await ServiceType.findOne({
    where: sequelize.json("name.en", agencyTypeNameEn),
  });

  if (!serviceType) {
    console.warn(`⚠️ No ServiceType found matching AgencyType: "${agencyTypeNameEn}"`);
    return [];
  }

  const categories = await ServiceCategory.findAll({
    where: { serviceTypeId: serviceType.id },
    include: [serviceTypeInclude],
    order: [[sequelize.json("name.en"), "ASC"]],
  });

  // Return the full objects (frontend handles language display)
  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name, // Returns {en, am}
    serviceTypeId: cat.serviceTypeId,
    type: cat.serviceType?.name, // Returns {en, am}
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