const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const Agency = require("./Agency");
const Kebele = require("./Kebele"); // import Kebele for association

const ResponderTeam = sequelize.define(
  "ResponderTeam",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: Agency, key: "id" },
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
    tableName: "responder_teams",
    timestamps: true,
  },
);

module.exports = ResponderTeam;
