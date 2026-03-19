const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const CrewRole = sequelize.define(
  "CrewRole",
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
    tableName: "crew_roles",
    timestamps: true,
  }
);

module.exports = CrewRole;