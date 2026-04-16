const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Service = sequelize.define(
  "Service",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // --- UPDATED KEBELE FIELD ---
    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kebeles", // This should match the tableName of your Kebele model
        key: "id",
      },
      onDelete: "RESTRICT", // Or "CASCADE" depending on your logic
      onUpdate: "CASCADE",
    },
    // ----------------------------

    subdivision: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    location: {
      type: DataTypes.JSON,
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
      type: DataTypes.ENUM("active", "inactive", "pending"),
      defaultValue: "active",
    },

    serviceTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "service_types",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    serviceCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "service_categories",
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },

    citizenId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    time: {
      type: DataTypes.TIME,
      allowNull: true,
    },
  },
  {
    tableName: "services",
    timestamps: true,
  },
);

module.exports = Service;
