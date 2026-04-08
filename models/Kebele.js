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
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: "responder_teams", key: "id" },
      onUpdate: "CASCADE",
      onDelete: "SET NULL",
    },
  },
  {
    tableName: "kebeles",
    timestamps: true,
    updatedAt: true,
  },
);

module.exports = Kebele;
