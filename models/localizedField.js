const localizedField = (DataTypes, { allowNull = true, defaultLanguage = "en" } = {}) => ({
  type: DataTypes.JSON,
  allowNull,
  defaultValue: {
    en: "",
    am: "",
    originalLanguage: defaultLanguage,
  },
});

module.exports = localizedField;
