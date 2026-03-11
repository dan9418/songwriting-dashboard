const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const ARTIST_SLUG = "dan-bednarczyk";
const ARTIST_NAME = "Dan Bednarczyk";
const PROJECT_SPECS = [
  { slug: "test-album", name: "Test Album", type: "album", trackCount: 10 },
  { slug: "test-ep", name: "Test EP", type: "ep", trackCount: 5 },
  { slug: "test-setlist", name: "Test Setlist", type: "setlist", trackCount: 8 },
  { slug: "test-single", name: "Test Single", type: "single", trackCount: 2 }
];
const TRACKS_ROOT = path.resolve("songwriting-data", "tracks");
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

function pad2(value) {
  return String(value).padStart(2, "0");
}

function toIsoDateOrNull(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return null;
  }
  return `${y}-${pad2(m)}-${pad2(d)}`;
}

function parseDateToken(token) {
  const trimmed = String(token ?? "").trim();
  if (!trimmed) {
    return { date: "1970-01-01", dateOverride: null };
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-");
    const iso = toIsoDateOrNull(year, month, day);
    if (iso) {
      return { date: iso, dateOverride: null };
    }
  }

  if (/^\d{1,2}-\d{1,2}-\d{2}$/.test(trimmed)) {
    const [month, day, yearTwo] = trimmed.split("-");
    const year = Number(yearTwo) >= 70 ? 1900 + Number(yearTwo) : 2000 + Number(yearTwo);
    const iso = toIsoDateOrNull(year, month, day);
    if (iso) {
      return { date: iso, dateOverride: null };
    }
  }

  if (/^\d{4}$/.test(trimmed)) {
    const iso = toIsoDateOrNull(trimmed, 1, 1);
    if (iso) {
      return { date: iso, dateOverride: trimmed };
    }
  }

  return { date: "1970-01-01", dateOverride: trimmed };
}

function runWrangler(args, options = {}) {
  if (process.platform === "win32") {
    const quoted = args
      .map((arg) => `'${String(arg).replace(/'/g, "''")}'`)
      .join(" ");
    return spawnSync(
      "powershell",
      ["-NoProfile", "-Command", `& wrangler ${quoted}`],
      options
    );
  }
  return spawnSync("wrangler", args, options);
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
  if (fs.existsSync(TRACKS_ROOT)) {
    return fs
      .readdirSync(TRACKS_ROOT, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  }

  const databaseName = readWranglerConfig();
  const args = [
    "d1",
    "execute",
    databaseName,
    ...(LOCAL ? [] : ["--remote"]),
    "--command",
    "SELECT slug FROM tracks ORDER BY slug ASC;",
    "--json"
  ];

  const result = runWrangler(args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `Unable to read track slugs from D1. status=${result.status} error=${result.error?.message ?? "none"} stderr=${result.stderr ?? ""} stdout=${result.stdout ?? ""}`
    );
  }

  let parsed;
  try {
    parsed = JSON.parse(result.stdout);
  } catch (error) {
    throw new Error(`Unable to parse D1 track slug output. ${error.message}`);
  }

  const rows = parsed?.[0]?.results;
  if (!Array.isArray(rows)) {
    throw new Error("D1 query for track slugs returned an unexpected payload.");
  }

  return rows.map((row) => row.slug).filter(Boolean);
}

function getAudioFilesForTrack(trackSlug) {
  const trackPath = path.join(TRACKS_ROOT, trackSlug);
  const audioDir = path.join(trackPath, "audio");
  if (!fs.existsSync(trackPath)) {
    return [];
  }

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
  const dateToken = parts[3];
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

  const { date, dateOverride } = parseDateToken(dateToken);

  return {
    slug: base,
    trackSlug,
    type,
    typeVersion,
    date,
    dateOverride,
    description
  };
}

function buildSeedData() {
  const trackSlugs = getTrackSlugs();
  if (trackSlugs.length < 15) {
    throw new Error(
      `At least 15 tracks are required to build test project assignments (found ${trackSlugs.length}).`
    );
  }

  const albumTrackSlugs = trackSlugs.slice(0, 10);
  const epTrackSlugs = trackSlugs.slice(10, 15);
  const albumOrEpTrackPool = [...albumTrackSlugs, ...epTrackSlugs];
  const setlistTrackSlugs = albumOrEpTrackPool.slice(0, 8);
  const singleTrackSlugs = epTrackSlugs.slice(0, 2);

  const projectAssignments = [
    { slug: "test-album", trackSlugs: albumTrackSlugs },
    { slug: "test-ep", trackSlugs: epTrackSlugs },
    { slug: "test-setlist", trackSlugs: setlistTrackSlugs },
    { slug: "test-single", trackSlugs: singleTrackSlugs }
  ];

  const trackArtistSlugs = Array.from(
    new Set(projectAssignments.flatMap((assignment) => assignment.trackSlugs))
  ).map((trackSlug) => ({ trackSlug, artistSlug: ARTIST_SLUG }));

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
        date: parsed.date,
        dateOverride: parsed.dateOverride,
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
        date: row.date,
        dateOverride: row.dateOverride,
        description: row.description
      });
    }
  }

  return {
    trackSlugs,
    projectAssignments,
    trackArtistSlugs,
    audioRows,
    adjustments
  };
}

function buildSql(seedData) {
  const lines = [];
  lines.push("PRAGMA foreign_keys = ON;");
  lines.push("");

  lines.push(
    `INSERT INTO artists (slug, name, description) VALUES (${sqlString(
      ARTIST_SLUG
    )}, ${sqlString(ARTIST_NAME)}, '') ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description;`
  );
  lines.push("");

  lines.push(
    `DELETE FROM project_tracks WHERE project_slug IN ('test-project', ${PROJECT_SPECS.map(
      (project) => sqlString(project.slug)
    ).join(", ")});`
  );
  lines.push(
    `DELETE FROM project_artists WHERE project_slug IN ('test-project', ${PROJECT_SPECS.map(
      (project) => sqlString(project.slug)
    ).join(", ")});`
  );
  lines.push(
    `DELETE FROM projects WHERE slug IN ('test-project', ${PROJECT_SPECS.map((project) =>
      sqlString(project.slug)
    ).join(", ")});`
  );
  lines.push("");

  for (const project of PROJECT_SPECS) {
    lines.push(
      `INSERT INTO projects (slug, name, description, type, release_date, remaster_date) VALUES (${sqlString(
        project.slug
      )}, ${sqlString(project.name)}, '', ${sqlString(
        project.type
      )}, NULL, NULL) ON CONFLICT(slug) DO UPDATE SET name = excluded.name, description = excluded.description, type = excluded.type, release_date = excluded.release_date, remaster_date = excluded.remaster_date;`
    );
    lines.push(
      `INSERT INTO project_artists (project_slug, artist_slug) VALUES (${sqlString(
        project.slug
      )}, ${sqlString(ARTIST_SLUG)}) ON CONFLICT(project_slug, artist_slug) DO NOTHING;`
    );
  }
  lines.push("");

  for (const slug of seedData.trackSlugs) {
    lines.push(
      `INSERT INTO tracks (slug, lyrics_path, notes_path, chords_path) VALUES (${sqlString(
        slug
      )}, NULL, NULL, NULL) ON CONFLICT(slug) DO UPDATE SET lyrics_path = COALESCE(excluded.lyrics_path, tracks.lyrics_path), notes_path = COALESCE(excluded.notes_path, tracks.notes_path), chords_path = COALESCE(excluded.chords_path, tracks.chords_path);`
    );
  }
  lines.push("");

  lines.push(`DELETE FROM track_artists WHERE artist_slug = ${sqlString(ARTIST_SLUG)};`);
  for (const row of seedData.trackArtistSlugs) {
    lines.push(
      `INSERT INTO track_artists (track_slug, artist_slug) VALUES (${sqlString(
        row.trackSlug
      )}, ${sqlString(row.artistSlug)}) ON CONFLICT(track_slug, artist_slug) DO NOTHING;`
    );
  }
  lines.push("");

  for (const assignment of seedData.projectAssignments) {
    let position = 1;
    for (const trackSlug of assignment.trackSlugs) {
      lines.push(
        `INSERT INTO project_tracks (project_slug, track_slug, position) VALUES (${sqlString(
          assignment.slug
        )}, ${sqlString(trackSlug)}, ${position}) ON CONFLICT(project_slug, track_slug) DO UPDATE SET position = excluded.position;`
      );
      position += 1;
    }
  }
  lines.push("");

  for (const row of seedData.audioRows) {
    lines.push(
      `INSERT INTO audio (slug, track_slug, type, type_version, description, date, date_override) VALUES (${sqlString(
        row.slug
      )}, ${sqlString(row.trackSlug)}, ${sqlString(row.type)}, ${
        row.typeVersion
      }, ${sqlNullableString(row.description)}, ${sqlString(
        row.date
      )}, ${sqlNullableString(row.dateOverride)}) ON CONFLICT(slug) DO UPDATE SET track_slug = excluded.track_slug, type = excluded.type, type_version = excluded.type_version, description = excluded.description, date = excluded.date, date_override = excluded.date_override;`
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

  const result = runWrangler(args, { stdio: "inherit" });
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
  for (const assignment of seedData.projectAssignments) {
    console.log(`Tracks linked to ${assignment.slug}: ${assignment.trackSlugs.length}`);
    console.log(`- ${assignment.slug}: ${assignment.trackSlugs.join(", ")}`);
  }

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
