const ServiceCategory = require("../models/ServiceCategory");
const ServiceType = require("../models/ServiceType");
const { Agency, AgencyType } = require("../models");
const { sequelize } = require("../config/db");

const serviceTypeInclude = {
  model: ServiceType,
  as: "serviceType",
  attributes: ["id", "name"],
};

// ── Safe ORDER BY ─────────────────────────────────────────────────────────────
// The name column may be VARCHAR (plain string) or JSONB ({en, am}).
// Qualifying with the table name prevents the "ambiguous column" error
// that arises when ServiceType (also has "name") is JOINed.
// The CASE handles both column types safely.
const nameOrderAsc = [
  [
    sequelize.literal(
      `CASE
         WHEN pg_typeof("ServiceCategory"."name") = 'jsonb'::regtype
         THEN ("ServiceCategory"."name"::jsonb)->>'en'
         ELSE "ServiceCategory"."name"::text
       END`
    ),
    "ASC",
  ],
];

// ── Helper: extract English name regardless of column type ───────────────────
const getEnName = (nameField) =>
  typeof nameField === "object" && nameField !== null
    ? nameField.en ?? Object.values(nameField)[0] ?? ""
    : String(nameField ?? "");

// ✅ CREATE CATEGORY
const createCategory = async ({ name, description, serviceTypeId }) => {
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  const englishName = getEnName(name);

  // Duplicate check that works for both VARCHAR and JSONB
  const all = await ServiceCategory.findAll({ where: { serviceTypeId } });
  const isDuplicate = all.some((cat) => getEnName(cat.name) === englishName);
  if (isDuplicate) throw new Error("Category name already exists for this service type");

  const category = await ServiceCategory.create({
    name        : typeof name        === "string" ? { en: name,        am: "" } : name,
    description : typeof description === "string" ? { en: description, am: "" } : description,
    serviceTypeId,
  });

  return category;
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async () => {
  return await ServiceCategory.findAll({
    include : [serviceTypeInclude],
    order   : nameOrderAsc,
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
    where   : { serviceTypeId },
    include : [serviceTypeInclude],
    order   : nameOrderAsc,
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

  const finalUpdates = { ...updates };
  if (updates.name && typeof updates.name === "object") {
    finalUpdates.name = { ...category.name, ...updates.name };
  }
  if (updates.description && typeof updates.description === "object") {
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

// ✅ GET CATEGORIES BY AGENCY ID
const getCategoriesByAgencyId = async (agencyId) => {
  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });
  if (!agency) throw new Error("Agency not found");

  const agencyTypeNameEn = getEnName(agency.agencyType?.name);
  if (!agencyTypeNameEn) throw new Error("Agency has no type assigned");

  // Find matching ServiceType in JS to avoid VARCHAR vs JSONB SQL issues
  const allServiceTypes = await ServiceType.findAll();
  const serviceType = allServiceTypes.find(
    (st) => getEnName(st.name) === agencyTypeNameEn
  );

  if (!serviceType) {
    console.warn(`⚠️ No ServiceType found matching AgencyType: "${agencyTypeNameEn}"`);
    return [];
  }

  const categories = await ServiceCategory.findAll({
    where   : { serviceTypeId: serviceType.id },
    include : [serviceTypeInclude],
    order   : nameOrderAsc,
  });

  return categories.map((cat) => ({
    id            : cat.id,
    name          : cat.name,
    serviceTypeId : cat.serviceTypeId,
    type          : cat.serviceType?.name,
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