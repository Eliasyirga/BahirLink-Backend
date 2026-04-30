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

    // 🔗 Link to Emergency
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

    // 👤 Reporter (citizen or guest)
    reporterId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    // 🚑 Responder (team/user who handled it)
    responderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 📝 Emergency description snapshot
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // 📍 Location snapshot
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // 📊 Final report status
    status: {
      type: DataTypes.ENUM("resolved", "verified", "archived"),
      defaultValue: "resolved",
    },
  },
  {
    tableName: "final_reports",
    timestamps: true,
  },
);

module.exports = FinalReport;
