const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const ResponderTeamKebele = sequelize.define(
  "ResponderTeamKebele",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    responderTeamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    agencyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "responder_team_kebeles",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["kebeleId", "agencyId"], // ensures kebele is unique per agency
      },
    ],
  },
);

module.exports = ResponderTeamKebele;
