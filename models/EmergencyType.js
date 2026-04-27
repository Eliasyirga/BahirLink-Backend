const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const EmergencyType = sequelize.define(
  "EmergencyType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
    tableName: "emergency_types",
    timestamps: true,
  },
);

module.exports = EmergencyType;
