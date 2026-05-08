const { 
  Category, 
  Service, 
  Cases, 
  ServiceType, 
  ServiceCategory,
  CaseType,
  Emergency,      // ✅ Added
  EmergencyType,  // ✅ Added
  Kebele          // ✅ Added
} = require("./models");
const translate = require("google-translate-api-x");

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const runFullSystemMigration = async () => {
  try {
    console.log("🛠 Starting Full System & Emergency Multi-Language Migration...");

    // 1. Emergency Types (e.g., "Fire", "Crime", "Medical")
    const emergencyTypes = await EmergencyType.findAll();
    console.log(`\n--- [1/9] Processing ${emergencyTypes.length} Emergency Types ---`);
    for (const type of emergencyTypes) {
      await processLocalization(type, 'name');
      await delay(500);
    }

    // 2. Kebeles (Location names)
    const kebeles = await Kebele.findAll();
    console.log(`\n--- [2/9] Processing ${kebeles.length} Kebeles ---`);
    for (const kebele of kebeles) {
      await processLocalization(kebele, 'name');
      await delay(500);
    }

    // 3. Case Types
    const caseTypes = await CaseType.findAll();
    console.log(`\n--- [3/9] Processing ${caseTypes.length} Case Types ---`);
    for (const type of caseTypes) {
      await processLocalization(type, 'name');
      await delay(500);
    }

    // 4. Service Types
    const serviceTypes = await ServiceType.findAll();
    console.log(`\n--- [4/9] Processing ${serviceTypes.length} Service Types ---`);
    for (const type of serviceTypes) {
      await processLocalization(type, 'name');
      await processLocalization(type, 'description');
      await delay(500);
    }

    // 5. Service Categories
    const serviceCats = await ServiceCategory.findAll();
    console.log(`\n--- [5/9] Processing ${serviceCats.length} Service Categories ---`);
    for (const cat of serviceCats) {
      await processLocalization(cat, 'name');
      await processLocalization(cat, 'description');
      await delay(500);
    }

    // 6. Generic Categories
    const categories = await Category.findAll();
    console.log(`\n--- [6/9] Processing ${categories.length} Categories ---`);
    for (const cat of categories) {
      await processLocalization(cat, 'name');
      await delay(500);
    }

    // 7. Services
    const services = await Service.findAll();
    console.log(`\n--- [7/9] Processing ${services.length} Services ---`);
    for (const service of services) {
      await processLocalization(service, 'name');
      await processLocalization(service, 'description');
      await processLocalization(service, 'subdivision');
      await processLocalization(service, 'street');
      await delay(500);
    }

    // 8. Cases
    const cases = await Cases.findAll();
    console.log(`\n--- [8/9] Processing ${cases.length} Cases ---`);
    for (const caseItem of cases) {
      await processLocalization(caseItem, 'fullName');
      await processLocalization(caseItem, 'description');
      await processLocalization(caseItem, 'distinctiveFeatures');
      await delay(500);
    }

    // 9. Emergencies (Reports from Users/Guests)
    const emergencies = await Emergency.findAll();
    console.log(`\n--- [9/9] Processing ${emergencies.length} Emergencies ---`);
    for (const emergency of emergencies) {
      await processLocalization(emergency, 'subdivision');
      await processLocalization(emergency, 'description');
      // If your emergency model stores additional notes or reports:
      if (emergency.report) await processLocalization(emergency, 'report');
      await delay(500);
    }

    console.log("\n🚀 GLOBAL MIGRATION COMPLETE! All emergency and service data is localized.");
    process.exit(0);
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  }
};

/**
 * Logic to check, translate, and update a field to JSONB {en, am}
 */
async function processLocalization(instance, fieldName) {
  let value = instance[fieldName];

  if (!value) return;

  // Cleanup for accidental stringified JSON
  if (typeof value === 'string' && value.trim().startsWith("{")) {
    try { value = JSON.parse(value); } catch (e) {}
  }

  const isPlainString = typeof value === 'string';
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

      await instance.update({ [fieldName]: updatedValue });
      console.log(`✅ -> ${res.text}`);
    } catch (error) {
      console.log(`\n⚠️ Error translating ${fieldName}:`, error.message);
    }
  }
}

runFullSystemMigration();