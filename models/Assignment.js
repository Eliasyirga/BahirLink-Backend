const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const Assignment = sequelize.define(
  "Assignment",
   {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  emergencyId: { type: DataTypes.INTEGER, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  role: { type: DataTypes.ENUM("responder", "dispatcher"), allowNull: false },
  status: {
    type: DataTypes.ENUM("assigned", "in_progress", "completed"),
    defaultValue: "assigned",
  },
}, {
  tableName: "assignments",
  timestamps: true,
});

module.exports = Assignment;
