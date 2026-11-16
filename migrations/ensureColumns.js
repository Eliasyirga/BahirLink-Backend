/**
 * Idempotent, additive startup migration.
 *
 * sequelize.sync() runs WITHOUT alter, so it never adds columns to tables
 * that already exist — and a model attribute with no DB column makes every
 * SELECT on that model fail. This adds the missing nullable columns before
 * sync() runs. Safe to run on every boot:
 *   ALTER TABLE IF EXISTS "<table>" ADD COLUMN IF NOT EXISTS "<col>" <type>
 * (IF EXISTS on the table: a fresh database gets the column from sync().)
 */

// [modelName, column, SQL type]
const REQUIRED_COLUMNS = [
  ["Emergency", "mediaPublicId", "VARCHAR(255)"],
  ["Cases", "mediaPublicId", "VARCHAR(255)"],
  ["Service", "mediaPublicId", "VARCHAR(255)"],
];

const SAFE_IDENT = /^[A-Za-z_][A-Za-z0-9_]*$/;

const ensureColumns = async (sequelize, log = console.log) => {
  // Resolve real table names from the model definitions (tableName option).
  const targets = REQUIRED_COLUMNS.map(([modelName, column, sqlType]) => {
    const model = sequelize.models[modelName];
    if (!model) throw new Error(`ensureColumns: model "${modelName}" is not defined`);
    const table = model.getTableName();
    const tableName = typeof table === "string" ? table : table.tableName;
    if (!SAFE_IDENT.test(tableName) || !SAFE_IDENT.test(column)) {
      throw new Error(`ensureColumns: unsafe identifier ${tableName}.${column}`);
    }
    return { tableName, column, sqlType };
  });

  const [existing] = await sequelize.query(
    `SELECT table_name, column_name FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name IN (:tables)`,
    { replacements: { tables: [...new Set(targets.map((t) => t.tableName))] } },
  );
  const tablesPresent = new Set(existing.map((r) => r.table_name));
  const has = new Set(existing.map((r) => `${r.table_name}.${r.column_name}`));

  const added = [];
  for (const { tableName, column, sqlType } of targets) {
    if (!tablesPresent.has(tableName)) {
      log(`[ensureColumns] ${tableName}: table not created yet (sync will create it)`);
      continue;
    }
    if (has.has(`${tableName}.${column}`)) {
      log(`[ensureColumns] ${tableName}.${column}: already present`);
      continue;
    }
    const sql = `ALTER TABLE IF EXISTS "${tableName}" ADD COLUMN IF NOT EXISTS "${column}" ${sqlType}`;
    await sequelize.query(sql);
    added.push(`${tableName}.${column}`);
    log(`[ensureColumns] ${sql} -> added`);
  }

  return { added, checked: targets.map((t) => `${t.tableName}.${t.column}`) };
};

module.exports = { ensureColumns, REQUIRED_COLUMNS };
