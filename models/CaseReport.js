const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Cases = require("./Cases");
const CaseType = require("./CaseType");
const Kebele = require("./Kebele"); // Import your Kebele model

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
      allowNull: true,
    },

    // Reference to the Kebele model
    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Kebele, key: "id" },
      onDelete: "CASCADE",
    },

    // The specific date and time they saw the person
    spottedAt: {
      type: DataTypes.DATE,
      allowNull: false,
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
      allowNull: true,
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
