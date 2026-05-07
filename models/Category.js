const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Category = sequelize.define(
  "Category",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },

    // ✅ CHANGED: Now using JSONB to store { "en": "...", "am": "..." }
    name: {
      type: DataTypes.JSONB, 
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    emergencyTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "emergency_types",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "categories",
    timestamps: true,

    indexes: [
      {
        unique: true,
        // Note: Unique constraints on JSONB fields can be tricky. 
        // This index now tracks the whole JSON object vs the ID.
        fields: ["name", "emergencyTypeId"], 
      },
    ],
  },
);

module.exports = Category;