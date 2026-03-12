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
      references: {
        model: "emergencies",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    senderType: {
      type: DataTypes.ENUM("user", "guest", "system"),
      allowNull: false,
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    senderRole: {
      type: DataTypes.ENUM(
        "guest",
        "responder",
        "dispatcher",
        "admin",
        "system",
      ),
      allowNull: false,
    },

    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    type: {
      type: DataTypes.ENUM("text", "system"),
      allowNull: false,
      defaultValue: "text",
    },
  },
  {
    tableName: "messages",
    timestamps: true,
  },
);

module.exports = Message;
