const fs = require("fs");
const path = require("path");

const DRY_RUN = process.argv.includes("--dryRun");
const ROOT = './songwriting-data/tracks'

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

function normalizeDateOrString(str) {
  const trimmed = str.trim();

  const match = trimmed.match(/^(\d{1,2})-(\d{1,2})-(\d{2})$/);

  if (!match) {
    return slugify(trimmed);
  }

  let month = match[1].padStart(2, "0");
  let day = match[2].padStart(2, "0");
  let year = match[3];

  const yearNum = parseInt(year, 10);
  year = yearNum < 50 ? `20${year}` : `19${year}`;

  return `${year}-${month}-${day}`;
}

function parseFilename(base) {
  const regex =
    /^(.+?) - (Demo|Note|Live) (\d+) \(([^)]+)\)(?: \[([^\]]+)\])?$/i;

  const match = base.match(regex);

  if (!match) return null;

  return {
    songTitle: match[1],
    type: match[2],
    version: match[3],
    dateOrString: match[4],
    description: match[5] || null
  };
}

function processFile(filePath, songSlug) {
  const ext = path.extname(filePath).toLowerCase();
  const base = path.basename(filePath, ext);

  const parsed = parseFilename(base);

  if (!parsed) {
    console.log("SKIP (pattern mismatch):", filePath);
    return;
  }

  const slugifiedTitle = slugify(parsed.songTitle);

  if (slugifiedTitle !== songSlug) {
    console.warn(
      `WARNING: title slug "${slugifiedTitle}" does not match folder "${songSlug}" -> ${filePath}`
    );
  }

  const type = parsed.type.toLowerCase();
  const version = parsed.version;

  const datePart = normalizeDateOrString(parsed.dateOrString);

  const parts = [
    songSlug,
    type,
    `v${version}`,
    datePart
  ];

  if (parsed.description) {
    parts.push(slugify(parsed.description));
  }

  const newName = parts.join("_") + ext;
  const newPath = path.join(path.dirname(filePath), newName);

  if (newPath === filePath) {
    return;
  }

  if (DRY_RUN) {
    console.log("DRY RUN:", filePath, "->", newPath);
  } else {
    fs.renameSync(filePath, newPath);
    console.log("RENAMED:", filePath, "->", newPath);
  }
}

function processDirectory(dir) {
  const songSlug = path.basename(dir);

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else {
      processFile(fullPath, songSlug);
    }
  }
}

function main() {
  if (!fs.existsSync(ROOT)) {
    console.error(`Directory not found: ${ROOT}`);
    process.exit(1);
  }

  const entries = fs.readdirSync(ROOT, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      processDirectory(path.join(ROOT, entry.name));
    }
  }

  if (DRY_RUN) {
    console.log("\nDry run complete — no files renamed.");
  }
}

main();
