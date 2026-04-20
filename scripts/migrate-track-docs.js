const fs = require("fs");
const path = require("path");
const {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} = require("@aws-sdk/client-s3");

const EXECUTE = process.argv.includes("--execute");
const TRACK_ARG_INDEX = process.argv.findIndex((arg) => arg === "--track");
const TRACK_FILTER =
  TRACK_ARG_INDEX >= 0 && process.argv[TRACK_ARG_INDEX + 1]
    ? process.argv[TRACK_ARG_INDEX + 1].trim()
    : null;

const DOC_TYPES = ["lyrics", "chords", "notes"];
const SECTION_LABELS = {
  lyrics: "Lyrics",
  chords: "Chords",
  notes: "Notes"
};

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

function createR2Client() {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");
  const bucket = process.env.CLOUDFLARE_R2_BUCKET ?? "songwriting-media";

  return {
    bucket,
    client: new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey }
    })
  };
}

function getTrackDocPath(trackSlug, type) {
  return `tracks/${trackSlug}/${type}.md`;
}

function buildTrackDocSection(label, body) {
  return `# ${label}\n\n${body}`;
}

function buildCombinedTrackDocContent(contentsByType) {
  return DOC_TYPES.filter((type) => contentsByType[type] !== null && contentsByType[type] !== undefined)
    .map((type) => buildTrackDocSection(SECTION_LABELS[type], contentsByType[type]))
    .join("\n\n");
}

function extractCombinedTrackDocSections(content) {
  const value = String(content ?? "");
  const headingRegex = /^# (Lyrics|Chords|Notes)(?:\r?\n|$)/gm;
  const matches = Array.from(value.matchAll(headingRegex));

  if (matches.length === 0 || matches[0].index !== 0) {
    return null;
  }

  const sections = {
    lyrics: null,
    chords: null,
    notes: null
  };
  let lastOrder = -1;

  for (let index = 0; index < matches.length; index += 1) {
    const current = matches[index];
    const label = current[1];
    const type = label.toLowerCase();
    const order = DOC_TYPES.indexOf(type);
    if (order < 0 || order <= lastOrder) {
      return null;
    }
    lastOrder = order;

    let bodyStart = current.index + current[0].length;
    if (value.slice(bodyStart, bodyStart + 1) === "\n") {
      bodyStart += 1;
    }

    const nextMatch = matches[index + 1];
    const bodyEnd = nextMatch ? Math.max(bodyStart, nextMatch.index - 2) : value.length;
    sections[type] = value.slice(bodyStart, bodyEnd);
  }

  return buildCombinedTrackDocContent(sections) === value ? sections : null;
}

function extractTrackDocEntry(key) {
  const match = /^tracks\/([^/]+)\/(lyrics|chords|notes)\.md$/i.exec(key);
  if (!match) {
    return null;
  }
  return {
    trackSlug: match[1],
    type: match[2].toLowerCase()
  };
}

async function listTrackDocKeys(r2) {
  const keysByTrackSlug = new Map();
  let continuationToken;

  do {
    const response = await r2.client.send(
      new ListObjectsV2Command({
        Bucket: r2.bucket,
        Prefix: "tracks/",
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    );

    for (const item of response.Contents ?? []) {
      if (!item.Key) {
        continue;
      }
      const entry = extractTrackDocEntry(item.Key);
      if (!entry) {
        continue;
      }
      if (TRACK_FILTER && entry.trackSlug !== TRACK_FILTER) {
        continue;
      }
      const current = keysByTrackSlug.get(entry.trackSlug) ?? {};
      current[entry.type] = item.Key;
      keysByTrackSlug.set(entry.trackSlug, current);
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keysByTrackSlug;
}

async function getMarkdownObject(r2, objectPath) {
  const response = await r2.client.send(
    new GetObjectCommand({
      Bucket: r2.bucket,
      Key: objectPath
    })
  );
  return response.Body ? response.Body.transformToString() : "";
}

async function putMarkdownObject(r2, objectPath, content) {
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: objectPath,
      Body: content,
      ContentType: "text/markdown; charset=utf-8"
    })
  );
}

async function deleteObject(r2, objectPath) {
  await r2.client.send(
    new DeleteObjectCommand({
      Bucket: r2.bucket,
      Key: objectPath
    })
  );
}

async function main() {
  loadEnv();
  const r2 = createR2Client();
  const keysByTrackSlug = await listTrackDocKeys(r2);
  const targetTrackSlugs = TRACK_FILTER
    ? [TRACK_FILTER]
    : Array.from(keysByTrackSlug.keys()).sort((left, right) => left.localeCompare(right));

  let scannedTracks = 0;
  let tracksWithChanges = 0;
  let createdCanonical = 0;
  let updatedCanonical = 0;
  let legacyDeletes = 0;
  let unchangedTracks = 0;
  const issues = [];

  for (const trackSlug of targetTrackSlugs) {
    scannedTracks += 1;

    try {
      const trackKeys = keysByTrackSlug.get(trackSlug) ?? {};
      const contentsByType = {
        lyrics: null,
        chords: null,
        notes: null
      };

      for (const type of DOC_TYPES) {
        const objectPath = trackKeys[type];
        if (!objectPath) {
          continue;
        }
        contentsByType[type] = await getMarkdownObject(r2, objectPath);
      }

      if (
        contentsByType.lyrics === null &&
        contentsByType.chords === null &&
        contentsByType.notes === null
      ) {
        unchangedTracks += 1;
        continue;
      }

      const canonicalPath = getTrackDocPath(trackSlug, "lyrics");
      const combinedCanonicalSections =
        contentsByType.lyrics === null ? null : extractCombinedTrackDocSections(contentsByType.lyrics);
      const sourcesByType = {
        lyrics: combinedCanonicalSections ? combinedCanonicalSections.lyrics : contentsByType.lyrics,
        chords: contentsByType.chords ?? combinedCanonicalSections?.chords ?? null,
        notes: contentsByType.notes ?? combinedCanonicalSections?.notes ?? null
      };
      const combinedContent = buildCombinedTrackDocContent(sourcesByType);
      const legacyTypesToDelete = DOC_TYPES.filter(
        (type) => type !== "lyrics" && contentsByType[type] !== null
      );
      const canonicalExists = contentsByType.lyrics !== null;
      const canonicalNeedsWrite = !canonicalExists || contentsByType.lyrics !== combinedContent;

      if (!canonicalNeedsWrite && legacyTypesToDelete.length === 0) {
        unchangedTracks += 1;
        continue;
      }

      tracksWithChanges += 1;
      if (canonicalNeedsWrite) {
        if (canonicalExists) {
          updatedCanonical += 1;
        } else {
          createdCanonical += 1;
        }
      }
      legacyDeletes += legacyTypesToDelete.length;

      if (!EXECUTE) {
        continue;
      }

      if (canonicalNeedsWrite) {
        await putMarkdownObject(r2, canonicalPath, combinedContent);
      }

      for (const type of legacyTypesToDelete) {
        await deleteObject(r2, getTrackDocPath(trackSlug, type));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown migration error";
      issues.push(`[${trackSlug}] ${message}`);
    }
  }

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  console.log(`Track filter: ${TRACK_FILTER ?? "(all tracks with track docs)"}`);
  console.log(`Scanned tracks: ${scannedTracks}`);
  console.log(`Tracks with changes: ${tracksWithChanges}`);
  console.log(`Canonical files to create/created: ${createdCanonical}`);
  console.log(`Canonical files to update/updated: ${updatedCanonical}`);
  console.log(`Legacy files to delete/deleted: ${legacyDeletes}`);
  console.log(`Unchanged tracks: ${unchangedTracks}`);
  console.log(`Issues: ${issues.length}`);

  if (issues.length > 0) {
    console.log("\nIssues:");
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  if (!EXECUTE) {
    console.log(
      "\nDry run complete. Re-run with --execute to write combined canonical track docs and delete legacy track docs from R2."
    );
  }
}

module.exports = {
  buildCombinedTrackDocContent,
  extractCombinedTrackDocSections
};

if (require.main === module) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
  });
}
