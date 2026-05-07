const { DataTypes } = require("sequelize");
const { sequelize } = require("../config/db");

const CaseType = sequelize.define("CaseType", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  // ✅ CHANGED: Multi-language Support
  name: {
    type: DataTypes.JSONB,
    allowNull: false,
    defaultValue: { en: "", am: "" },
  },
}, {
  tableName: "case_types",
  timestamps: true,
  indexes: [
    {
      // ✅ NOTE: Standard unique constraint on JSONB works on the whole object.
      // We keep this to prevent exact duplicate JSON objects.
      unique: true,
      fields: ["name"],
    },
  ],
});

module.exports = CaseType;