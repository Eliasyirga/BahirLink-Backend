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

    // 👤 Original Reporter Info (Automated)
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

    // 🚑 Responder (The staff member closing the case)
    responderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // 🧠 Manual Input Attributes
    incidentSummary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

<<<<<<< HEAD
=======
    injuredCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    deceasedCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },

    // 📸 Media & Location Snapshots
    media: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },

>>>>>>> 2d1f39e (updated)
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },

<<<<<<< HEAD
=======
    // 📊 Lifecycle Status
>>>>>>> 2d1f39e (updated)
    status: {
      // Added 'verified' and 'archived' so your service functions don't crash
      type: DataTypes.ENUM("resolved", "verified", "archived"),
      defaultValue: "resolved",
    },

    // 🛡️ Verification Tracking
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    tableName: "final_reports",
    timestamps: true,
  },
);

module.exports = FinalReport;
