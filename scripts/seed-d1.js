const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const USER_ID = 1;
const USER_NAME = "Dan";
const PROJECT_SLUG = "test-project";
const PROJECT_NAME = "Test Project";
const PROJECT_TYPE = "album";
const TRACKS_ROOT = path.resolve(
  "songwriting-data",
  "users",
  "dan",
  "tracks"
);
const OUTPUT_SQL_PATH = path.resolve("scripts", "sql", "seed.sql");

const EXECUTE = process.argv.includes("--execute");
const LOCAL = process.argv.includes("--local");

const AUDIO_TYPES = new Set(["note", "demo", "live"]);
const AUDIO_EXTENSIONS = new Set([
  ".aac",
  ".aif",
  ".aiff",
  ".flac",
  ".m4a",
  ".mp3",
  ".mp4",
  ".ogg",
  ".wav"
]);

function sqlString(value) {
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlNullableString(value) {
  if (value === null || value === undefined || value === "") {
    return "NULL";
  }
  return sqlString(value);
}

function readWranglerConfig() {
  const configPath = path.resolve("wrangler.jsonc");
  if (!fs.existsSync(configPath)) {
    throw new Error("wrangler.jsonc not found.");
  }
  const raw = fs.readFileSync(configPath, "utf8");
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(
      `wrangler.jsonc is not valid JSON. Remove comments/trailing commas before running execute mode. ${error.message}`
    );
  }

  const db = parsed?.d1_databases?.[0];
  if (!db?.database_name) {
    throw new Error("wrangler.jsonc is missing d1_databases[0].database_name.");
  }

  return db.database_name;
}

function getTrackSlugs() {
  if (!fs.existsSync(TRACKS_ROOT)) {
    throw new Error(`Tracks path not found: ${TRACKS_ROOT}`);
  }

  return fs
    .readdirSync(TRACKS_ROOT, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

function getAudioFilesForTrack(trackSlug) {
  const trackPath = path.join(TRACKS_ROOT, trackSlug);
  const audioDir = path.join(trackPath, "audio");

  const listAudio = (dirPath) =>
    fs
      .readdirSync(dirPath, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name)
      .filter((name) => AUDIO_EXTENSIONS.has(path.extname(name).toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

  if (fs.existsSync(audioDir)) {
    const fromAudioDir = listAudio(audioDir);
    if (fromAudioDir.length > 0) {
      return fromAudioDir;
    }
  }

  return listAudio(trackPath);
}

function parseAudioFilename(trackSlug, fileName) {
  const ext = path.extname(fileName).toLowerCase();
  const base = path.basename(fileName, ext);
  const parts = base.split("_");

  if (parts.length < 4) {
    throw new Error(
      `Cannot parse audio filename "${fileName}" for track "${trackSlug}". Expected at least 4 underscore-separated parts.`
    );
  }

  const parsedSlug = parts[0];
  const type = parts[1];
  const versionToken = parts[2];
  const dateDescriptor = parts[3];
  const description = parts.length > 4 ? parts.slice(4).join("_") : null;

  if (parsedSlug !== trackSlug) {
    throw new Error(
      `Audio filename slug "${parsedSlug}" does not match folder slug "${trackSlug}" in "${fileName}".`
    );
  }

  if (!AUDIO_TYPES.has(type)) {
    throw new Error(
      `Invalid audio type "${type}" in "${fileName}". Expected one of: note, demo, live.`
    );
  }

  const versionMatch = /^v(\d+)$/.exec(versionToken);
  if (!versionMatch) {
    throw new Error(
      `Invalid version token "${versionToken}" in "${fileName}". Expected format v<number>.`
    );
  }

  const typeVersion = Number(versionMatch[1]);
  if (!Number.isInteger(typeVersion) || typeVersion < 1) {
    throw new Error(
      `Invalid type version "${typeVersion}" in "${fileName}". Expected integer >= 1.`
    );
  }

  return {
    slug: base,
    trackSlug,
    type,
    typeVersion,
    dateDescriptor,
    description
  };
}

function buildSeedData() {
  const trackSlugs = getTrackSlugs();
  const projectTrackSlugs = trackSlugs.slice(0, 10);
  const parsedAudioRows = [];
  const audioRows = [];
  const adjustments = [];
  const rowsByTrackType = new Map();

  for (const trackSlug of trackSlugs) {
    const fileNames = getAudioFilesForTrack(trackSlug);
    for (const fileName of fileNames) {
      const parsed = parseAudioFilename(trackSlug, fileName);
      parsedAudioRows.push({
        slug: parsed.slug,
        trackSlug: parsed.trackSlug,
        type: parsed.type,
        typeVersion: parsed.typeVersion,
        dateDescriptor: parsed.dateDescriptor,
        description: parsed.description,
        fileName
      });
    }
  }

  for (const row of parsedAudioRows) {
    const key = `${row.trackSlug}|${row.type}`;
    const bucket = rowsByTrackType.get(key) || [];
    bucket.push(row);
    rowsByTrackType.set(key, bucket);
  }

  for (const rows of rowsByTrackType.values()) {
    rows.sort((a, b) => {
      if (a.typeVersion !== b.typeVersion) {
        return a.typeVersion - b.typeVersion;
      }
      return a.fileName.localeCompare(b.fileName);
    });

    let nextVersion = rows.reduce(
      (maxVersion, row) => Math.max(maxVersion, row.typeVersion),
      0
    ) + 1;
    const seenVersions = new Set();

    for (const row of rows) {
      let resolvedVersion = row.typeVersion;
      if (seenVersions.has(row.typeVersion)) {
        resolvedVersion = nextVersion;
        nextVersion += 1;
        adjustments.push({
          trackSlug: row.trackSlug,
          fileName: row.fileName,
          originalVersion: row.typeVersion,
          resolvedVersion
        });
      }
      seenVersions.add(resolvedVersion);

      audioRows.push({
        slug: row.slug,
        trackSlug: row.trackSlug,
        type: row.type,
        typeVersion: resolvedVersion,
        dateDescriptor: row.dateDescriptor,
        description: row.description
      });
    }
  }

  return {
    trackSlugs,
    projectTrackSlugs,
    audioRows,
    adjustments
  };
}

function buildSql(seedData) {
  const lines = [];
  lines.push("PRAGMA foreign_keys = ON;");
  lines.push("");

  lines.push(
    `INSERT INTO users (id, name) VALUES (${USER_ID}, ${sqlString(
      USER_NAME
    )}) ON CONFLICT(id) DO UPDATE SET name = excluded.name;`
  );

  lines.push(
    `INSERT INTO projects (user_id, slug, name, description, type, release_date, remaster_date) VALUES (${USER_ID}, ${sqlString(
      PROJECT_SLUG
    )}, ${sqlString(PROJECT_NAME)}, '', ${sqlString(
      PROJECT_TYPE
    )}, NULL, NULL) ON CONFLICT(user_id, slug) DO UPDATE SET name = excluded.name, description = excluded.description, type = excluded.type, release_date = excluded.release_date, remaster_date = excluded.remaster_date;`
  );
  lines.push("");

  for (const slug of seedData.trackSlugs) {
    lines.push(
      `INSERT INTO tracks (user_id, slug, lyrics_path, notes_path, chords_path) VALUES (${USER_ID}, ${sqlString(
        slug
      )}, NULL, NULL, NULL) ON CONFLICT(user_id, slug) DO UPDATE SET lyrics_path = excluded.lyrics_path, notes_path = excluded.notes_path, chords_path = excluded.chords_path;`
    );
  }
  lines.push("");

  let position = 1;
  for (const trackSlug of seedData.projectTrackSlugs) {
    lines.push(
      `INSERT INTO project_tracks (user_id, project_slug, track_slug, position) VALUES (${USER_ID}, ${sqlString(
        PROJECT_SLUG
      )}, ${sqlString(trackSlug)}, ${position}) ON CONFLICT(user_id, project_slug, track_slug) DO UPDATE SET position = excluded.position;`
    );
    position += 1;
  }
  lines.push("");

  for (const row of seedData.audioRows) {
    lines.push(
      `INSERT INTO audio (user_id, slug, track_slug, type, type_version, description, date_descriptor, date_uploaded) VALUES (${USER_ID}, ${sqlString(
        row.slug
      )}, ${sqlString(row.trackSlug)}, ${sqlString(row.type)}, ${
        row.typeVersion
      }, ${sqlNullableString(row.description)}, ${sqlString(
        row.dateDescriptor
      )}, NULL) ON CONFLICT(user_id, slug) DO UPDATE SET track_slug = excluded.track_slug, type = excluded.type, type_version = excluded.type_version, description = excluded.description, date_descriptor = excluded.date_descriptor, date_uploaded = excluded.date_uploaded;`
    );
  }

  lines.push("");
  return `${lines.join("\n")}\n`;
}

function writeSeedSql(sql) {
  fs.mkdirSync(path.dirname(OUTPUT_SQL_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_SQL_PATH, sql, "utf8");
}

function executeSeedSql() {
  const databaseName = readWranglerConfig();
  const args = [
    "d1",
    "execute",
    databaseName,
    ...(LOCAL ? [] : ["--remote"]),
    "--file",
    OUTPUT_SQL_PATH
  ];

  const result = spawnSync("wrangler", args, { stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error("wrangler d1 execute failed.");
  }
}

function main() {
  const seedData = buildSeedData();
  const sql = buildSql(seedData);
  writeSeedSql(sql);

  console.log(`Seed SQL written: ${OUTPUT_SQL_PATH}`);
  console.log(`Tracks inserted: ${seedData.trackSlugs.length}`);
  console.log(`Audio rows inserted: ${seedData.audioRows.length}`);
  console.log(
    `Tracks linked to ${PROJECT_SLUG}: ${seedData.projectTrackSlugs.length}`
  );
  console.log(
    `Project tracks chosen: ${seedData.projectTrackSlugs.join(", ")}`
  );

  if (seedData.adjustments.length > 0) {
    console.log("Adjusted duplicate type_version values:");
    for (const item of seedData.adjustments) {
      console.log(
        `- ${item.fileName}: v${item.originalVersion} -> v${item.resolvedVersion}`
      );
    }
  } else {
    console.log("No duplicate type_version adjustments needed.");
  }

  if (EXECUTE) {
    executeSeedSql();
  } else {
    console.log(
      "Dry run only. Re-run with --execute to apply seed SQL (uses --remote by default; pass --local for local D1)."
    );
  }
}

main();
