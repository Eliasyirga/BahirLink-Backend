const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ServiceCategory = sequelize.define(
  "ServiceCategory",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ✅ CHANGED: Multi-language Support
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    // ✅ CHANGED: Multi-language Support
    description: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { en: "", am: "" },
    },

    serviceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "service_types",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
  },
  {
    tableName: "service_categories",
    timestamps: true,
    indexes: [
      {
        unique: true,
        // ✅ NOTE: Uniqueness now applies to the entire JSON object + serviceTypeId.
        // To be safer, you can create a functional index in SQL for name->>'en'.
        fields: ["name", "serviceTypeId"],
      },
    ],
  },
);

module.exports = ServiceCategory;