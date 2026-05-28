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
      field: "phone_number", // maps JS camelCase → DB snake_case column
    },

    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "kebele_id",
      references: { model: Kebele, key: "id" },
      onDelete: "CASCADE",
    },

    spottedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "spotted_at",
    },

    caseId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "caseId", // 💡 Change this to "caseId" (or delete the line entirely!)
      references: { model: Cases, key: "id" },
      onDelete: "CASCADE",
    },

    caseTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "caseTypeId", // 💡 Change this to match your real database column name
      references: { model: CaseType, key: "id" },
      onDelete: "CASCADE",
    },

    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "reporterId", // 💡 Matches your real database column name
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
    underscored: true, // tells Sequelize to use snake_case for createdAt/updatedAt too
  },
);

module.exports = CaseReport;
