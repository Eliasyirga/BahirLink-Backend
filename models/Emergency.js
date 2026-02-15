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

    emergencyType: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    location: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    mediaType: {
      type: DataTypes.ENUM("photo", "video", "audio"),
      allowNull: true,
    },

    status: {
      type: DataTypes.ENUM(
        "reported",
        "assigned",
        "in_progress",
        "resolved"
      ),
      defaultValue: "reported",
    },

    citizenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
    },

    guestId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "guests",
        key: "id",
      },
    },
  },
  {
    tableName: "emergencies",
    timestamps: true,
  }
);

module.exports = Emergency;
