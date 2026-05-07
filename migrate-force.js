const { 
  Category, 
  Service, 
  Cases, 
  ServiceType, 
  ServiceCategory,
  CaseType // ✅ Added CaseType
} = require("./models");
const translate = require("google-translate-api-x");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runFullSystemMigration = async () => {
  try {
    console.log("🛠 Starting Full System Multi-Language Migration...");

    // 1. Case Types (e.g., "Theft", "Fire", "Accident")
    // Added this at the start as it's a foundational lookup table
    const caseTypes = await CaseType.findAll();
    console.log(`\n--- [1/6] Processing ${caseTypes.length} Case Types ---`);
    for (const type of caseTypes) {
      await processLocalization(type, 'name');
      await delay(500);
    }

    // 2. Service Types (e.g., "Medical", "Security")
    const serviceTypes = await ServiceType.findAll();
    console.log(`\n--- [2/6] Processing ${serviceTypes.length} Service Types ---`);
    for (const type of serviceTypes) {
      await processLocalization(type, 'name');
      await processLocalization(type, 'description');
      await delay(500);
    }

    // 3. Service Categories (e.g., "Fire Department", "Ambulance")
    const serviceCats = await ServiceCategory.findAll();
    console.log(`\n--- [3/6] Processing ${serviceCats.length} Service Categories ---`);
    for (const cat of serviceCats) {
      await processLocalization(cat, 'name');
      await processLocalization(cat, 'description');
      await delay(500);
    }

    // 4. Categories (Generic Categories)
    const categories = await Category.findAll();
    console.log(`\n--- [4/6] Processing ${categories.length} Categories ---`);
    for (const cat of categories) {
      await processLocalization(cat, 'name');
      await delay(500);
    }

    // 5. Services (The specific utility or office)
    const services = await Service.findAll();
    console.log(`\n--- [5/6] Processing ${services.length} Services ---`);
    for (const service of services) {
      await processLocalization(service, 'name');
      await processLocalization(service, 'description');
      await processLocalization(service, 'subdivision');
      await processLocalization(service, 'street');
      await delay(500);
    }

    // 6. Cases (Active incidents or reports)
    const cases = await Cases.findAll();
    console.log(`\n--- [6/6] Processing ${cases.length} Cases ---`);
    for (const caseItem of cases) {
      await processLocalization(caseItem, 'fullName');
      await processLocalization(caseItem, 'description');
      await processLocalization(caseItem, 'distinctiveFeatures');
      await delay(500);
    }

    console.log("\n🚀 GLOBAL MIGRATION COMPLETE! Your database is now JSONB localized.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed with a critical error:", err);
    process.exit(1);
  }
};

/**
 * Logic to check, translate, and update a field to JSONB {en, am}
 */
async function processLocalization(instance, fieldName) {
  let value = instance[fieldName];

  if (!value) return;

  // Handle accidental stringified JSON from previous migrations or manual entry
  if (typeof value === 'string' && value.trim().startsWith("{")) {
    try { value = JSON.parse(value); } catch (e) {}
  }

  const isPlainString = typeof value === 'string';
  // Check if it's already an object but missing the Amharic translation
  const isMissingAm = typeof value === 'object' && value !== null && (!value.am || value.am === "");

  if (isPlainString || isMissingAm) {
    const englishText = isPlainString ? value : (value.en || "");
    
    if (!englishText || englishText.trim() === "") return;

    try {
      const modelName = instance.constructor.name;
      process.stdout.write(`Translating [${modelName}] ${fieldName}: "${englishText.substring(0, 15)}..." `);
      
      const res = await translate(englishText, { to: "am" });
      
      const updatedValue = {
        en: englishText,
        am: res.text
      };

      // We use .update() to trigger Sequelize's hooks if any exist
      await instance.update({ [fieldName]: updatedValue });
      console.log(`✅ -> ${res.text}`);
    } catch (error) {
      console.log(`\n⚠️ Error translating field ${fieldName}:`, error.message);
    }
  }
}

runFullSystemMigration();