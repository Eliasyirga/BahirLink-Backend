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
  }
);

// ✅ Critical: This must match the variable name defined above
module.exports = ServiceType;