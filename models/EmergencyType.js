const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const EmergencyType = sequelize.define(
  "EmergencyType",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // name will now store: { "en": "Police", "am": "ፖሊስ" }
    name: {
      type: DataTypes.JSONB, // Change from JSON to JSONB
      allowNull: false,
    },
    description: {
      type: DataTypes.JSONB, // Change from JSON to JSONB
      allowNull: true,
    },
  },
  {
    tableName: "emergency_types",
    timestamps: true,
  }
);

module.exports = EmergencyType;