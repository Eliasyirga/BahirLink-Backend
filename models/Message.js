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

    chatId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "chats",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },

    senderRole: {
      type: DataTypes.STRING,
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

    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },

    attachmentUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    tableName: "messages",
    timestamps: true,
    indexes: [
      {
        fields: ["chatId"],
      },
    ],
  },
);

module.exports = Message;
