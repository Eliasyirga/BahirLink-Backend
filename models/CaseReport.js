// models/CaseReport.js
const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Cases = require("./Cases");
const CaseType = require("./CaseType"); // type of report (e.g., "wanted", "lost", etc.)

const CaseReport = sequelize.define(
  "CaseReport",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true, // optional explanation
    },

    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Cases, key: "id" },
      onDelete: "CASCADE",
    },

    caseTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: CaseType, key: "id" },
      onDelete: "CASCADE",
    },

    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: true, // optional: user who reported
      references: { model: "users", key: "id" },
      onDelete: "SET NULL",
    },

    status: {
      type: DataTypes.ENUM("pending", "reviewed", "dismissed"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "case_reports",
    timestamps: true,
  },
);

module.exports = CaseReport;
