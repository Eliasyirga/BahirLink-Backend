const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const CaseType = sequelize.define("CaseType", {
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

}, {
  tableName: "case_types",
  timestamps: true,
});

module.exports = CaseType;