const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const AgencyType = require("./AgencyType");

const Agency = sequelize.define(
  "Agency",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "users",
        key: "id",
      },
      onDelete: "CASCADE",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: true,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    location: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
    agencyTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: AgencyType,
        key: "id",
      },
      onDelete: "CASCADE",
    },
  },
  {
    tableName: "agencies",
    timestamps: true,
    updatedAt: true,
  },
);

module.exports = Agency;
