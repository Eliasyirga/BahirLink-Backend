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

    text: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  },
);

module.exports = Message;