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

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    kebele: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    subdivision: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    street: {
      type: DataTypes.STRING,
      allowNull: true, 
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
      type: DataTypes.ENUM("reported", "assigned", "in_progress", "resolved"),
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

    emergencyTypeId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: "emergency_types",
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "emergencies",
    timestamps: true,
  },
);

module.exports = Emergency;
