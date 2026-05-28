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
      // 💡 Stripped snake_case tracking override map to capture "phoneNumber"
    },

    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      // 💡 Fixed typo "kebele_d" and standardized layout to capture camelCase "kebeleId"
      references: { model: Kebele, key: "id" },
      onDelete: "CASCADE",
    },

    spottedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      // 💡 Stripped mapping to correctly match "spottedAt" from database payload
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
      type: DataTypes.ENUM("pending", "approved", "rejected", "resolved"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "case_reports",
    timestamps: true,
  },
);

module.exports = CaseReport;
