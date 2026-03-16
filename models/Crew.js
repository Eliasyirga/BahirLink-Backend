const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const ResponderTeam = require("./ResponderTeam");
const CrewRole = require("./CrewRole");

const Crew = sequelize.define(
  "Crew",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    responderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: ResponderTeam, key: "id" },
      onDelete: "CASCADE",
    },
    roleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: CrewRole, key: "id" },
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
      allowNull: false,
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
    status: {
      type: DataTypes.ENUM("active", "inactive"),
      defaultValue: "active",
    },
  },
  {
    tableName: "crews",
    timestamps: true,
  }
);

// Associations


module.exports = Crew;