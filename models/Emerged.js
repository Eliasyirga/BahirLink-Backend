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

    // 👤 optional responder-written summary
    summary: {
      type: DataTypes.TEXT,
      allowNull: true,
    },

    // 📍 grouping reference
    kebeleId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "kebeles",
        key: "id",
      },
    },

    subdivision: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    street: {
      type: DataTypes.STRING,
      allowNull: true,
    },

    // 🧭 optional for future smart grouping (distance/NLP)
    location: {
      type: DataTypes.JSON,
      allowNull: true,
    },

    // ⚡ lifecycle of grouped case
    status: {
      type: DataTypes.ENUM("reported", "in_progress", "resolved"),
      defaultValue: "reported",
    },

    // 🔢 optional cached value (performance)
    reportCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    tableName: "emerged",
    timestamps: true,

    indexes: [
      { fields: ["kebeleId"] },
      { fields: ["status"] },
    ],
  },
);

module.exports = Emerged;