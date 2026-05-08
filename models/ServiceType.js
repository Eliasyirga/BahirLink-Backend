const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ServiceType = sequelize.define(
  "ServiceType",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    // Multi-language Support using JSONB
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
      // Note: unique constraint on JSONB can be tricky.
      // If you need strict uniqueness, it's better to handle it in logic
      // or via a unique index on a specific JSON path.
      defaultValue: { en: "", am: "" },
    },
    description: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { en: "", am: "" },
    },
  },
  {
    tableName: "service_types",
    timestamps: true,
  },
);

// ✅ Critical: This must match the variable name defined above
module.exports = ServiceType;
