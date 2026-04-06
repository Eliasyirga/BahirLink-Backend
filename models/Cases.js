const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Kebele = require("./Kebele");
const Agency = require("./Agency");
const CaseType = require("./CaseType");
const ResponderTeam = require("./ResponderTeam");

const Cases = sequelize.define(
  "Cases",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },

    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
    },

    age: DataTypes.INTEGER,

    gender: {
      type: DataTypes.ENUM("male", "female"),
    },

    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },

    lastSeenLocationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Kebele,
        key: "id",
      },
      onDelete: "SET NULL",
      onUpdate: "CASCADE",
    },

    mediaUrl: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    mediaType: {
      type: DataTypes.ENUM("photo", "video", "audio"),
      allowNull: true,
    },

    contactInfo: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    caseTypeId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: CaseType, key: "id" },
      onDelete: "CASCADE",
    },

    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Agency, key: "id" },
      onDelete: "CASCADE",
    },

    responderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ResponderTeam, key: "id" },
      onDelete: "CASCADE",
    },

    status: {
      type: DataTypes.ENUM("pending", "approved", "rejected"),
      defaultValue: "pending",
    },
  },
  {
    tableName: "cases",
    timestamps: true,
  },
);

module.exports = Cases;
