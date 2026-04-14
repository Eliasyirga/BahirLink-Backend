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
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "service_types",
    timestamps: true,
  },
);

module.exports = ServiceType;
