const { Op } = require("sequelize");
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
const nameOrderAsc = [
  [
    sequelize.literal(
      `CASE
         WHEN pg_typeof("ServiceCategory"."name") = 'jsonb'::regtype
         THEN ("ServiceCategory"."name"::jsonb)->>'en'
         ELSE "ServiceCategory"."name"::text
       END`,
    ),
    "ASC",
  ],
];

// ── Helper: extract English name or parse stringified JSON ───────────────────
const getEnName = (nameField) => {
  if (typeof nameField === "object" && nameField !== null) {
    return nameField.en ?? Object.values(nameField)[0] ?? "";
  }
  return String(nameField ?? "");
};

const parseJsonField = (field) => {
  if (typeof field !== "string") return field;
  try {
    const parsed = JSON.parse(field);
    // Handle double-stringified cases
    return typeof parsed === "string" ? JSON.parse(parsed) : parsed;
  } catch {
    return field;
  }
};

// ✅ CREATE CATEGORY
const createCategory = async ({ name, description, serviceTypeId }) => {
  const serviceType = await ServiceType.findByPk(serviceTypeId);
  if (!serviceType) throw new Error("ServiceType not found");

  // Logic Check: Avoid duplicate English names within the same ServiceType
  const englishName = getEnName(name);
  const existing = await ServiceCategory.findOne({
    where: {
      serviceTypeId,
      ...sequelize.json("name.en", englishName),
    },
  });

  if (existing)
    throw new Error("Category name already exists for this service type");

  const category = await ServiceCategory.create({
    name: typeof name === "string" ? { en: name, am: "" } : name,
    description:
      typeof description === "string"
        ? { en: description, am: "" }
        : description,
    serviceTypeId,
  });

  return category;
};

// ✅ GET ALL CATEGORIES
const getAllCategories = async () => {
  return await ServiceCategory.findAll({
    include: [serviceTypeInclude],
    order: nameOrderAsc,
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
    order: nameOrderAsc,
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
    finalUpdates.description = {
      ...category.description,
      ...updates.description,
    };
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

  const searchTerm = agencyTypeNameEn.toLowerCase().trim();

  // Search for matching ServiceType using either JSON path or casted Text
  const serviceType = await ServiceType.findOne({
    where: {
      [Op.or]: [
        sequelize.where(
          sequelize.fn("LOWER", sequelize.json("name.en")),
          searchTerm,
        ),
        sequelize.where(
          sequelize.fn(
            "LOWER",
            sequelize.cast(sequelize.col("ServiceType.name"), "text"),
          ),
          { [Op.like]: `%${searchTerm}%` },
        ),
      ],
    },
  });

  if (!serviceType) {
    console.warn(`⚠️ No ServiceType found matching: "${searchTerm}"`);
    return [];
  }

  const categories = await ServiceCategory.findAll({
    where: { serviceTypeId: serviceType.id },
    include: [serviceTypeInclude],
    order: nameOrderAsc,
  });

  // Return cleaned objects for frontend consumption
  return categories.map((cat) => {
    const item = cat.get({ plain: true });
    return {
      id: item.id,
      name: parseJsonField(item.name),
      serviceTypeId: item.serviceTypeId,
      type: item.serviceType ? parseJsonField(item.serviceType.name) : null,
    };
  });
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
