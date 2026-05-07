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

    // ✅ CHANGED: Using JSONB for multi-language support
    name: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    // ✅ CHANGED: Using JSONB for multi-language descriptions
    description: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { en: "", am: "" },
    },

    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kebeles",
        key: "id",
      },
      onDelete: "RESTRICT",
      onUpdate: "CASCADE",
    },

    // ✅ CHANGED: subdivision and street name localization
    subdivision: {
      type: DataTypes.JSONB,
      allowNull: false,
      defaultValue: { en: "", am: "" },
    },

    street: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: { en: "", am: "" },
    },

    location: {
      type: DataTypes.JSONB,
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
    // Optional: indexing logic similar to Category if you need uniqueness constraints
    indexes: [
      {
        fields: ["name"],
      },
    ],
  }
);

module.exports = Service;