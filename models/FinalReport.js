const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const FinalReport = sequelize.define(
  "FinalReport",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    emergencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: "emergencies",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    reporterType: {
      type: DataTypes.ENUM("user", "guest"),
      allowNull: false,
      defaultValue: "user",
    },

    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    responderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    incidentSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    injuredCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    deceasedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    media: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },

    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM("resolved"),
      defaultValue: "resolved",
    },
  },
  {
    tableName: "final_reports",
    timestamps: true,
  },
);

module.exports = FinalReport;
