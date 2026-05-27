const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Cases = require("./Cases");
const CaseType = require("./CaseType");
const Kebele = require("./Kebele");

const CaseReport = sequelize.define(
  "CaseReport",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    description: {
      type: DataTypes.JSONB,
      allowNull: true,
    },

    phoneNumber: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isNumeric: true, // This ensures only numbers are allowed
        len: [10, 15], // You can enforce a length constraint (e.g., 10 to 15 digits)
      },
    },

    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Kebele, key: "id" },
      onDelete: "CASCADE",
    },

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
