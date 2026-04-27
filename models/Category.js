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

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    // ❌ REMOVED: type (not needed in DB, generated dynamically)

    emergencyTypeId: {
      type: DataTypes.INTEGER, // must match emergency_types.id
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
        fields: ["name", "emergencyTypeId"], // same name allowed in different types
      },
    ],
  },
);

module.exports = Category;
