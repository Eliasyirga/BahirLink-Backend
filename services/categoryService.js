const { Category, EmergencyType } = require("../models");
const { Op } = require("sequelize");

const createCategory = async (data) => {
  // 1. Validate EmergencyType exists
  const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);
  if (!emergencyType) {
    throw new Error("EmergencyType not found");
  }

  // 2. FIXED: Uniqueness check for JSONB
  // This checks if the English name already exists within the JSONB object
  const existingCategory = await Category.findOne({
    where: {
      emergencyTypeId: data.emergencyTypeId,
      [Op.or]: [
        { "name.en": data.name.en },
        { "name.am": data.name.am }
      ]
    },
  });

  if (existingCategory) {
    throw new Error("Category with this name already exists in this EmergencyType");
  }

  // 3. Create category (data.name should be { en: "...", am: "..." })
  const category = await Category.create({
    name: data.name, 
    emergencyTypeId: data.emergencyTypeId,
  });

  return {
    id: category.id,
    name: category.name,
    emergencyTypeId: category.emergencyTypeId,
    type: emergencyType.name.en || emergencyType.name, // Return string for dashboard
  };
};

const deleteCategory = async (categoryId) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("Category not found");
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

  return categories.map((cat) => ({
    id: cat.id,
    name: cat.name,
    emergencyTypeId: cat.emergencyTypeId,
    emergencyType: cat.emergencyType,
    // Dashboard usually expects a string, so we pick .en
    type: cat.emergencyType.name.en || cat.emergencyType.name, 
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
    type: cat.emergencyType.name.en || cat.emergencyType.name,
  }));
};

const updateCategory = async (categoryId, data) => {
  const category = await Category.findByPk(categoryId);
  if (!category) throw new Error("Category not found");

  if (data.emergencyTypeId) {
    const emergencyType = await EmergencyType.findByPk(data.emergencyTypeId);
    if (!emergencyType) throw new Error("EmergencyType not found");
  }

  // Duplicate check for JSONB names
  if (data.name) {
    const existingCategory = await Category.findOne({
      where: {
        emergencyTypeId: data.emergencyTypeId ?? category.emergencyTypeId,
        [Op.or]: [
          { "name.en": data.name.en },
          { "name.am": data.name.am }
        ],
        id: { [Op.ne]: categoryId } // Not this current category
      },
    });

    if (existingCategory) {
      throw new Error("Category with this name already exists in this EmergencyType");
    }
  }

  await category.update({
    name: data.name ?? category.name,
    emergencyTypeId: data.emergencyTypeId ?? category.emergencyTypeId,
  });

  const updatedEmergencyType = await EmergencyType.findByPk(category.emergencyTypeId);

  return {
    id: category.id,
    name: category.name,
    emergencyTypeId: category.emergencyTypeId,
    type: updatedEmergencyType.name.en || updatedEmergencyType.name,
  };
};

const getCategoriesByAgencyId = async (agencyId) => {
  const { Agency, AgencyType } = require("../models");

  const agency = await Agency.findByPk(agencyId, {
    include: { model: AgencyType, as: "agencyType" },
  });

  if (!agency) throw new Error("Agency not found");

  const agencyTypeName = agency.agencyType?.name;
  if (!agencyTypeName) throw new Error("Agency has no type assigned");

  const agencyTypeToEmergencyType = {
    Police: "Crime",
    Health: "Health",
    Fire: "Fire",
    Ambulance: "Health",
  };

  const targetEmergencyTypeName = agencyTypeToEmergencyType[agencyTypeName];
  
  // NOTE: We use Op.or to check the English name in the JSONB field
  const emergencyType = await EmergencyType.findOne({
    where: {
      [Op.or]: [
        { "name.en": targetEmergencyTypeName },
        { name: targetEmergencyTypeName } // Fallback for old string data
      ]
    },
  });

  if (!emergencyType)
    throw new Error(`EmergencyType "${targetEmergencyTypeName}" not found in DB`);

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
    type: cat.emergencyType.name.en || cat.emergencyType.name,
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