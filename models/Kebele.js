const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");
const ResponderTeam = require("./ResponderTeam"); // import the team model

const Kebele = sequelize.define(
  "Kebele",
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
    responderTeamId: {
      // foreign key pointing to ResponderTeam
      type: DataTypes.INTEGER,
      allowNull: true, // initially nullable
      references: { model: "responder_teams", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL", // if team deleted, kebele becomes unassigned
    },
  },
  {
    tableName: "kebeles",
    timestamps: true,
    updatedAt: true,
  },
);

module.exports = Kebele;
