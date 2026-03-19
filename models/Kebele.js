const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Kebele = sequelize.define(
  "Kebele",
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
  },
  {
    tableName: "kebeles",
    timestamps: true,
    updatedAt: true,
  },
);

module.exports = Kebele;
