const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Chat = sequelize.define(
  "Chat",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    type: {
      type: DataTypes.ENUM("emergency", "service"),
      allowNull: false,
    },

    emergencyId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "emergencies",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    serviceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "services",
        key: "id",
      },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM("active", "closed"),
      defaultValue: "active",
    },
  },
  {
    tableName: "chats",
    timestamps: true,

    validate: {
      onlyOneParent() {
        if (!this.emergencyId && !this.serviceId) {
          throw new Error("Chat must belong to emergency or service");
        }
        if (this.emergencyId && this.serviceId) {
          throw new Error("Chat cannot belong to both");
        }
      },
    },
  },
);

module.exports = Chat;
