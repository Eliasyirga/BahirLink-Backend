const translate = require("google-translate-api-x");

const autoTranslate = async (fieldData) => {
  // If input is null/undefined, return null
  if (!fieldData) return null;

  // Convert string to object: "Fire" -> { en: "Fire" }
  let data = typeof fieldData === "string" ? { en: fieldData } : { ...fieldData };

  // If we have English but no Amharic, translate it
  if (data.en && !data.am) {
    try {
      const res = await translate(data.en, { to: "am" });
      data.am = res.text;
    } catch (err) {
      console.warn("Translation failed, using English as fallback.");
      data.am = data.en; // Critical: always ensure 'am' has a value
    }
  }

  return data; // Make sure this is returned!
};