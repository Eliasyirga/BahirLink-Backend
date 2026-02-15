const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Guest = sequelize.define(
  "Guest",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    contactNo: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
  },
  {
    tableName: "guests",
    timestamps: true,
    updatedAt: false,
  },
);

module.exports = Guest;
