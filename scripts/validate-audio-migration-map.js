const fs = require("fs");
const path = require("path");

const DEFAULT_BACKUP_ROOT =
  "C:\\Users\\dan94\\Downloads\\songwriting-dashboard-media-backup-2026-05-25T04-42-45-941Z\\media\\audio";
const backupRoot = process.argv[2] ? path.resolve(process.argv[2]) : DEFAULT_BACKUP_ROOT;
const migrationPath = path.resolve("scripts/sql/migrations/0009_audio_first_class_ids.sql");

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (/\.(mp3|m4a|mp4)$/i.test(entry.name)) {
      files.push(fullPath);
    }
  }
  return files;
}

function toObjectKey(filePath) {
  const relativePath = path.relative(backupRoot, filePath).split(path.sep).join("/");
  return /^tracks\/[^/]+\/audio\/[^/]+$/.test(relativePath) ? relativePath : null;
}

function main() {
  if (!fs.existsSync(backupRoot)) {
    throw new Error(`Backup root not found: ${backupRoot}`);
  }
  if (!fs.existsSync(migrationPath)) {
    throw new Error(`Migration file not found: ${migrationPath}`);
  }

  const objectKeys = walk(backupRoot).map(toObjectKey).filter(Boolean).sort();
  const migration = fs.readFileSync(migrationPath, "utf8");
  const missingFromMigration = objectKeys.filter((key) => !migration.includes(key.replace(/'/g, "''")));
  const duplicatedKeys = objectKeys.filter((key, index) => index > 0 && objectKeys[index - 1] === key);

  console.log(`Backup root: ${backupRoot}`);
  console.log(`Audio objects in backup: ${objectKeys.length}`);
  console.log(`Duplicate object keys: ${duplicatedKeys.length}`);
  console.log(`Objects missing from migration map: ${missingFromMigration.length}`);

  if (duplicatedKeys.length > 0) {
    console.log("\nDuplicate object keys:");
    for (const key of duplicatedKeys.slice(0, 20)) {
      console.log(`- ${key}`);
    }
  }

  if (missingFromMigration.length > 0) {
    console.log("\nMissing object keys:");
    for (const key of missingFromMigration.slice(0, 20)) {
      console.log(`- ${key}`);
    }
  }

  if (duplicatedKeys.length > 0 || missingFromMigration.length > 0) {
    process.exitCode = 1;
  }
}

main();
