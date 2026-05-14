
const localize = (item, lang, fields = ["name"]) => { 
  if (!item) return null;

  if (Array.isArray(item)) {
    return item.map((i) => localize(i, lang, fields));
  }

  const plainItem = item.get ? item.get({ plain: true }) : { ...item };

  fields.forEach((field) => {
    let value = plainItem[field];

    // 1. Parse stringified JSON if found
    if (typeof value === "string" && value.trim().startsWith("{")) {
      try {
        value = JSON.parse(value);
      } catch (e) { /* ignore */ }
    }

    if (value && typeof value === "object") {
      plainItem[field] = value[lang] || value["en"] || "";
    } else {
      plainItem[field] = value || "";
    }
  });

  // 3. RECURSIVE: Localize associated Categories (If item is EmergencyType)
  if (plainItem.categories && Array.isArray(plainItem.categories)) {
    plainItem.categories = plainItem.categories.map((cat) =>
      localize(cat, lang, ["name"])
    );
  }

  // 4. RECURSIVE: Localize associated EmergencyType (If item is Category)
  if (plainItem.emergencyType && typeof plainItem.emergencyType === "object") {
    plainItem.emergencyType = localize(plainItem.emergencyType, lang, ["name"]);
  }

  return plainItem;
};

module.exports = { localize };