const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const AgencyType = sequelize.define(
  "AgencyType",
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
    creatorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
    },
  },
  {
    tableName: "agency_types",
    timestamps: true,
    updatedAt: false,
  },
);

module.exports = AgencyType;
