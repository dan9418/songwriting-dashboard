const fs = require("fs");
const path = require("path");
const {
  ListObjectsV2Command,
  S3Client
} = require("@aws-sdk/client-s3");

const EXECUTE = process.argv.includes("--execute");
const TRACK_ARG_INDEX = process.argv.findIndex((arg) => arg === "--track");
const TRACK_FILTER =
  TRACK_ARG_INDEX >= 0 && process.argv[TRACK_ARG_INDEX + 1]
    ? process.argv[TRACK_ARG_INDEX + 1].trim()
    : null;

const ISO_DATE_TOKEN_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_DATE_TOKEN_REGEX = /^\d{1,2}-\d{1,2}-\d{2}$/;
const YEAR_TOKEN_REGEX = /^\d{4}$/;
const CANONICAL_FILENAME_REGEX =
  /^(?<trackSlug>[a-z0-9]+(?:-[a-z0-9]+)*)_(?<type>note|demo|live)_v(?<version>\d+)_(?<dateToken>[^_]+?)(?:_(?<description>.+))?(?<extension>\.mp3|\.m4a|\.mp4)$/i;

function normalizeNullableText(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : null;
}

function loadEnv() {
  const envPath = path.resolve(".env.local");
  if (!fs.existsSync(envPath)) {
    return;
  }
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || /^\s*#/.test(line)) {
      continue;
    }
    const index = line.indexOf("=");
    if (index < 0) {
      continue;
    }
    const key = line.slice(0, index).trim();
    if (!key || process.env[key]) {
      continue;
    }
    let value = line.slice(index + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

function getRequiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function toIsoDate(year, month, day) {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (!Number.isInteger(y) || !Number.isInteger(m) || !Number.isInteger(d)) {
    return null;
  }
  if (m < 1 || m > 12 || d < 1 || d > 31) {
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
  const mm = String(m).padStart(2, "0");
  const dd = String(d).padStart(2, "0");
  return `${y}-${mm}-${dd}`;
}

function parseDateToken(rawToken) {
  const token = String(rawToken ?? "").trim();
  if (!token) {
    return { date: "1970-01-01", dateOverride: null };
  }

  if (ISO_DATE_TOKEN_REGEX.test(token)) {
    const [year, month, day] = token.split("-").map(Number);
    const iso = toIsoDate(year, month, day);
    if (iso) {
      return { date: iso, dateOverride: null };
    }
  }

  if (LEGACY_DATE_TOKEN_REGEX.test(token)) {
    const [monthStr, dayStr, yearStr] = token.split("-");
    const month = Number(monthStr);
    const day = Number(dayStr);
    const yearTwo = Number(yearStr);
    const year = yearTwo >= 70 ? 1900 + yearTwo : 2000 + yearTwo;
    const iso = toIsoDate(year, month, day);
    if (iso) {
      return { date: iso, dateOverride: null };
    }
  }

  if (YEAR_TOKEN_REGEX.test(token)) {
    const year = Number(token);
    const iso = toIsoDate(year, 1, 1);
    if (iso) {
      return { date: iso, dateOverride: token };
    }
  }

  return { date: "1970-01-01", dateOverride: token };
}

function fileBaseName(fileName) {
  const dotIndex = fileName.lastIndexOf(".");
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
}

function parseAudioFileMetadata(trackSlug, fileName) {
  const match = CANONICAL_FILENAME_REGEX.exec(fileName);
  if (!match?.groups) {
    throw new Error(`Unsupported audio filename format: ${fileName}`);
  }

  const parsedTrackSlug = String(match.groups.trackSlug).toLowerCase();
  if (parsedTrackSlug !== trackSlug) {
    throw new Error(
      `Track slug mismatch in filename. key track slug "${trackSlug}", filename track slug "${parsedTrackSlug}"`
    );
  }
  const type = String(match.groups.type).toLowerCase();
  if (!["note", "demo", "live"].includes(type)) {
    throw new Error(`Invalid type "${type}" in filename: ${fileName}`);
  }
  const typeVersion = Number(match.groups.version);
  if (!Number.isInteger(typeVersion) || typeVersion < 1) {
    throw new Error(`Invalid type version in filename: ${fileName}`);
  }
  const { date, dateOverride } = parseDateToken(match.groups.dateToken);

  return {
    slug: fileBaseName(fileName),
    type,
    typeVersion,
    description: normalizeNullableText(match.groups.description),
    date,
    dateOverride
  };
}

async function createD1Client() {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getRequiredEnv("CLOUDFLARE_API_TOKEN");

  async function query(sql, params = []) {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          authorization: `Bearer ${apiToken}`,
          "content-type": "application/json"
        },
        body: JSON.stringify({ sql, params })
      }
    );
    const payload = await response.json().catch(() => null);
    if (!response.ok || !payload?.success) {
      const message =
        payload?.errors?.map((error) => error.message).find(Boolean) ??
        "Cloudflare D1 query request failed.";
      throw new Error(message);
    }
    const firstResult = payload.result?.[0];
    if (!firstResult?.success) {
      throw new Error(firstResult?.error ?? "Cloudflare D1 query was not successful.");
    }
    return firstResult.results ?? [];
  }

  return { query };
}

function createR2Client() {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "songwriting-media";
  const client = new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
  return { client, bucket };
}

async function listAllAudioKeysFromR2(client, bucket) {
  const keys = [];
  let continuationToken;
  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: "tracks/",
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    );
    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }
    continuationToken = response.IsTruncated
      ? response.NextContinuationToken
      : undefined;
  } while (continuationToken);
  return keys;
}

function normalizeTypeVersions(rows) {
  const byType = new Map();
  for (const row of rows) {
    const bucket = byType.get(row.type) || [];
    bucket.push(row);
    byType.set(row.type, bucket);
  }

  let adjustedVersions = 0;
  const normalized = [];
  for (const bucket of byType.values()) {
    bucket.sort((left, right) => {
      if (left.typeVersion !== right.typeVersion) {
        return left.typeVersion - right.typeVersion;
      }
      return left.slug.localeCompare(right.slug);
    });
    let nextVersion =
      bucket.reduce((max, row) => Math.max(max, row.typeVersion), 0) + 1;
    const seenVersions = new Set();
    for (const row of bucket) {
      if (seenVersions.has(row.typeVersion)) {
        normalized.push({ ...row, typeVersion: nextVersion });
        seenVersions.add(nextVersion);
        adjustedVersions += 1;
        nextVersion += 1;
      } else {
        normalized.push(row);
        seenVersions.add(row.typeVersion);
      }
    }
  }
  normalized.sort((left, right) => left.slug.localeCompare(right.slug));
  return { normalized, adjustedVersions };
}

function rowsEqual(existing, desired) {
  return (
    existing.type === desired.type &&
    Number(existing.typeVersion) === desired.typeVersion &&
    normalizeNullableText(existing.description) ===
      normalizeNullableText(desired.description) &&
    existing.date === desired.date &&
    normalizeNullableText(existing.dateOverride) ===
      normalizeNullableText(desired.dateOverride)
  );
}

async function main() {
  loadEnv();
  const d1 = await createD1Client();
  const { client, bucket } = createR2Client();

  const trackRows = await d1.query("SELECT slug FROM tracks ORDER BY slug ASC;");
  const knownTrackSlugs = new Set(trackRows.map((row) => row.slug));
  if (TRACK_FILTER && !knownTrackSlugs.has(TRACK_FILTER)) {
    throw new Error(`Track "${TRACK_FILTER}" was not found in D1 tracks table.`);
  }

  const keys = await listAllAudioKeysFromR2(client, bucket);
  const keysByTrack = new Map();
  const issues = [];

  for (const key of keys) {
    const match = /^tracks\/([^/]+)\/audio\/([^/]+)$/.exec(key);
    if (!match) {
      continue;
    }
    const trackSlug = match[1];
    const fileName = match[2];
    if (TRACK_FILTER && trackSlug !== TRACK_FILTER) {
      continue;
    }

    if (!knownTrackSlugs.has(trackSlug)) {
      issues.push(`[orphan-track] ${key} (track "${trackSlug}" not found in D1 tracks)`);
      continue;
    }

    try {
      const parsed = parseAudioFileMetadata(trackSlug, fileName);
      const bucketRows = keysByTrack.get(trackSlug) || [];
      bucketRows.push(parsed);
      keysByTrack.set(trackSlug, bucketRows);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown parse error";
      issues.push(`[parse-error] ${key} (${message})`);
    }
  }

  const existingRows = await d1.query(
    `
    SELECT
      slug,
      track_slug AS trackSlug,
      type,
      type_version AS typeVersion,
      description,
      date,
      date_override AS dateOverride
    FROM audio
    ${TRACK_FILTER ? "WHERE track_slug = ?" : ""}
    ORDER BY track_slug ASC, slug ASC;
    `,
    TRACK_FILTER ? [TRACK_FILTER] : []
  );

  const existingByTrack = new Map();
  for (const row of existingRows) {
    const bucketRows = existingByTrack.get(row.trackSlug) || [];
    bucketRows.push(row);
    existingByTrack.set(row.trackSlug, bucketRows);
  }

  let parsedCount = 0;
  let adjustedVersionCount = 0;
  let inserts = 0;
  let updates = 0;
  let deletes = 0;
  let unchanged = 0;

  const targetTracks = TRACK_FILTER
    ? [TRACK_FILTER]
    : Array.from(
        new Set([
          ...Array.from(keysByTrack.keys()),
          ...Array.from(existingByTrack.keys())
        ])
      ).sort((left, right) => left.localeCompare(right));

  for (const trackSlug of targetTracks) {
    const parsedRows = keysByTrack.get(trackSlug) || [];
    const { normalized: desiredRows, adjustedVersions } = normalizeTypeVersions(parsedRows);
    adjustedVersionCount += adjustedVersions;
    parsedCount += desiredRows.length;

    const desiredBySlug = new Map(desiredRows.map((row) => [row.slug, row]));
    const existingTrackRows = existingByTrack.get(trackSlug) || [];
    const existingBySlug = new Map(existingTrackRows.map((row) => [row.slug, row]));

    const staleSlugs = existingTrackRows
      .map((row) => row.slug)
      .filter((slug) => !desiredBySlug.has(slug));

    deletes += staleSlugs.length;
    for (const row of desiredRows) {
      const existing = existingBySlug.get(row.slug);
      if (!existing) {
        inserts += 1;
      } else if (rowsEqual(existing, row)) {
        unchanged += 1;
      } else {
        updates += 1;
      }
    }

    if (!EXECUTE) {
      continue;
    }

    if (staleSlugs.length > 0) {
      const placeholders = staleSlugs.map(() => "?").join(", ");
      await d1.query(`DELETE FROM audio WHERE track_slug = ? AND slug IN (${placeholders});`, [
        trackSlug,
        ...staleSlugs
      ]);
    }

    for (const row of desiredRows) {
      await d1.query(
        `
        INSERT INTO audio (slug, track_slug, type, type_version, description, date, date_override)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          track_slug = excluded.track_slug,
          type = excluded.type,
          type_version = excluded.type_version,
          description = excluded.description,
          date = excluded.date,
          date_override = excluded.date_override;
        `,
        [
          row.slug,
          trackSlug,
          row.type,
          row.typeVersion,
          normalizeNullableText(row.description),
          row.date,
          normalizeNullableText(row.dateOverride)
        ]
      );
    }
  }

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  console.log(`Track filter: ${TRACK_FILTER ?? "(all tracks)"}`);
  console.log(`Parsed R2 audio files: ${parsedCount}`);
  console.log(`Adjusted duplicate versions: ${adjustedVersionCount}`);
  console.log(`Will insert/inserted: ${inserts}`);
  console.log(`Will update/updated: ${updates}`);
  console.log(`Will delete/deleted: ${deletes}`);
  console.log(`Unchanged rows: ${unchanged}`);
  console.log(`Issues: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\nFirst issues:");
    for (const issue of issues.slice(0, 20)) {
      console.log(`- ${issue}`);
    }
  }

  if (issues.length > 0) {
    process.exitCode = 1;
    return;
  }

  if (!EXECUTE) {
    console.log(
      "\nDry run complete. Re-run with --execute to apply reconciliation to D1."
    );
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
