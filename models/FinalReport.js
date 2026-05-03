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

    // 👤 Reporter Metadata
    reporterType: {
      type: DataTypes.ENUM("user", "guest"),
      allowNull: false,
      defaultValue: "user",
    },
    userId: { type: DataTypes.INTEGER, allowNull: true },
    deviceId: { type: DataTypes.STRING, allowNull: true },

    // 🚑 Responder (The staff member who finalized this)
    responderId: { type: DataTypes.INTEGER, allowNull: true },

    // 🧠 Narrative & Summary
    incidentSummary: { type: DataTypes.TEXT, allowNull: true },

    // 👥 Victim Statistics
    injuredCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    deceasedCount: { type: DataTypes.INTEGER, defaultValue: 0 },

    // 🔍 NEW: Investigation & Crime Details
    witnesses: {
      type: DataTypes.JSON, // Array of names or objects: [{name: "John", phone: "..."}]
      allowNull: true,
      defaultValue: [],
    },

    suspects: {
      type: DataTypes.JSON, // Details of persons who performed the crime
      allowNull: true,
      defaultValue: [],
    },

    propertyDamage: {
      type: DataTypes.TEXT, // Description of what was destroyed/damaged
      allowNull: true,
      field: "property_damage", // maps to DB column
    },

    propertyDamageValue: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0.0,
      field: "property_damage_value",
    },

    // 📸 Evidence & Location Snapshots
    media: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // 📊 Status
    status: {
      type: DataTypes.ENUM("resolved", "verified", "archived"),
      defaultValue: "resolved",
    },

    // 🛡️ Admin Verification (Matching your service logic)
    verifiedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "verified_by",
    },
    verifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "verified_at",
    },
  },
  {
    tableName: "final_reports",
    timestamps: true,
  },
);

module.exports = FinalReport;
