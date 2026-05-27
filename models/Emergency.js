const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Emergency = sequelize.define(
  "Emergency",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    // ─── JSONB: stores { en: "...", am: "..." } ───────────────────────────────
    description: {
      type: DataTypes.JSONB,
      allowNull: true,
      comment:
        "Localised description e.g. { en: 'Fire on 2nd floor', am: '...' }",
    },
    subdivision: {
      type: DataTypes.JSONB,
      allowNull: false,
      comment: "Localised subdivision/area name e.g. { en: 'Bole', am: 'ቦሌ' }",
    },

    // ─── Plain fields ─────────────────────────────────────────────────────────
    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "kebeles", key: "id" },
    },
    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.JSON,
      allowNull: true,
      comment: "{ latitude: float, longitude: float }",
    },
    mediaUrl: {
      type: DataTypes.TEXT, // ✅ FIXED: Removes character limits for massive cloud URLs
      allowNull: true,
    },

    mediaType: {
      type: DataTypes.ENUM("photo", "video", "audio"),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("reported", "assigned", "in_progress", "resolved"),
      defaultValue: "reported",
    },
    report: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Resolver's closing report",
    },
    reporterType: {
      type: DataTypes.ENUM("user", "guest"),
      allowNull: true,
    },
    deviceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Mobile device identifier for guest tracking",
    },
    time: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "HH:MM:SS string extracted from the reported datetime",
    },

    citizenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "users", key: "id" },
    },
    guestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "guests", key: "id" },
    },
    emergencyTypeId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "emergency_types", key: "id" },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    categoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "categories", key: "id" },
    },
    isChatEnabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: "Set to true when a responder sends their first message",
    },
    chatInitiatedByResponderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "responder_teams", key: "id" },
      comment: "The responder team that opened this chat thread",
    },
    chatInitiatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: "Timestamp of when the responder first enabled chat",
    },
  },
  {
    tableName: "emergencies",
    timestamps: true,
  },
);

module.exports = Emergency;
