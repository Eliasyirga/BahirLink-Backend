const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const EmergencyType = sequelize.define(
  "EmergencyType",
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
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
    tableName: "emergency_types",
    timestamps: true,
  },
);

module.exports = EmergencyType;
