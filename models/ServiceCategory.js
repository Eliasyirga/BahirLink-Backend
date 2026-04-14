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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    serviceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "service_types",
        key: "id",
      },
    },
  },
  {
    tableName: "service_categories",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "serviceTypeId"],
      },
    ],
  },
);

module.exports = ServiceCategory;
