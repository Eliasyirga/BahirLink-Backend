const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Message = sequelize.define(
  "Message",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    emergencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "emergencies", key: "id" },
    },

    // The citizen involved in this emergency chat (for easy filtering/auditing)
    citizenId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: "users", key: "id" },
    },

    // The responder team engaged in this chat (set once chat is initiated)
    responderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "responder_teams", key: "id" },
    },

    // 🔥 NEW: who sent it (important fix)
    senderType: {
      type: DataTypes.ENUM("user", "responderTeam"),
      allowNull: false,
    },

    // 🔥 sender ID from either table
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },

    messageType: {
      type: DataTypes.ENUM("text", "audio"),
      allowNull: false,
      defaultValue: "text",
    },

    text: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    audioUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  },
);

module.exports = Message;