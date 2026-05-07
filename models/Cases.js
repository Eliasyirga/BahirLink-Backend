const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Kebele = require("./Kebele");
const Agency = require("./Agency");
const CaseType = require("./CaseType");
const ResponderTeam = require("./ResponderTeam");

const Cases = sequelize.define(
  "Cases",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ✅ CHANGED: Multi-language Support
    fullName: {
      type: DataTypes.JSONB, 
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    reward: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
      defaultValue: 0.0,
    },

    priority: {
      type: DataTypes.ENUM("low", "medium", "high", "critical"),
      defaultValue: "medium",
    },

    lastSeenDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },

    height: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    weight: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    // ✅ CHANGED: Multi-language Support
    distinctiveFeatures: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { en: "", am: "" },
    },

    isDangerous: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    age: DataTypes.INTEGER,

    gender: {
      type: DataTypes.ENUM("male", "female"),
    },

    // ✅ CHANGED: Multi-language Support
    description: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    lastSeenLocationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Kebele,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    mediaType: {
      type: DataTypes.ENUM("photo", "video", "audio"),
      allowNull: true,
    },

    contactInfo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    caseTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: CaseType, key: "id" },
      onDelete: "CASCADE",
    },

    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Agency, key: "id" },
      onDelete: "CASCADE",
    },

    responderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ResponderTeam, key: "id" },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected", "resolved"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "cases",
    timestamps: true,
    // Add indexes for optimized searching within JSONB if needed
    indexes: [
      {
        fields: ["status"],
      },
    ],
  }
);

module.exports = Cases;