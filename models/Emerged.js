const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Emerged = sequelize.define(
  "Emerged",
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

    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "kebeles",
        key: "id",
      },
    },

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

    status: {
      type: DataTypes.ENUM("reported", "in_progress", "resolved"),
      defaultValue: "reported",
    },
  },
  {
    tableName: "emerged",
    timestamps: true,
  },
);

module.exports = Emerged;
