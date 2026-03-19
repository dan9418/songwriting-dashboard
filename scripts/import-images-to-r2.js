const fs = require("fs");
const path = require("path");
const {
  PutObjectCommand,
  S3Client
} = require("@aws-sdk/client-s3");

const DEFAULT_SOURCE_DIR = "C:\\dev\\img";
const EXECUTE = process.argv.includes("--execute");
const SOURCE_ARG_INDEX = process.argv.findIndex((arg) => arg === "--source");
const SOURCE_DIR =
  SOURCE_ARG_INDEX >= 0 && process.argv[SOURCE_ARG_INDEX + 1]
    ? path.resolve(process.argv[SOURCE_ARG_INDEX + 1])
    : DEFAULT_SOURCE_DIR;

const PROJECT_IMAGE_SUFFIXES = new Set(["front", "back", "jacket"]);
const TRACK_ALIAS_BY_SLUG = new Map([
  ["the-third-rock", "the-view-from-the-third-rock-from-the-sun"]
]);

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

function createD1Client() {
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

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function normalizeSlug(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function stripTrackPrefix(value) {
  return value.replace(/^\d+-/, "");
}

function stripTrackSuffix(value) {
  return value.replace(/-web$/, "");
}

function contentTypeForExtension(extension) {
  const normalized = extension.toLowerCase();
  if (normalized === ".jpg" || normalized === ".jpeg") {
    return "image/jpeg";
  }
  if (normalized === ".png") {
    return "image/png";
  }
  if (normalized === ".webp") {
    return "image/webp";
  }
  if (normalized === ".gif") {
    return "image/gif";
  }
  throw new Error(`Unsupported image extension: ${extension}`);
}

function inferMapping(relativePath) {
  const normalizedPath = toPosixPath(relativePath);
  const parts = normalizedPath.split("/");
  const extension = path.extname(relativePath).toLowerCase();
  const fileName = path.basename(relativePath, extension);

  if (parts[0] === "artists" && parts.length === 2) {
    const artistSlug = normalizeSlug(fileName);
    return {
      entityType: "artist",
      entitySlug: artistSlug,
      imageSlug: artistSlug,
      path: `images/${artistSlug}${extension}`,
      relativePath: normalizedPath,
      extension
    };
  }

  if (parts[0] === "artists" && parts.length === 3) {
    const projectSlug = normalizeSlug(fileName);
    const imageSlug = `${projectSlug}-front`;
    return {
      entityType: "project",
      entitySlug: projectSlug,
      imageSlug,
      path: `images/${imageSlug}${extension}`,
      relativePath: normalizedPath,
      extension
    };
  }

  if (parts[0] === "album-covers" && parts.length === 4) {
    const projectSlug = normalizeSlug(parts[2]);
    const baseSlug = normalizeSlug(fileName);
    const imageSlug =
      baseSlug === projectSlug ? `${projectSlug}-front` : baseSlug;

    const suffix = imageSlug.slice(projectSlug.length + 1);
    if (!imageSlug.startsWith(`${projectSlug}-`) || !PROJECT_IMAGE_SUFFIXES.has(suffix)) {
      throw new Error(`Unsupported project image naming: ${normalizedPath}`);
    }

    return {
      entityType: "project",
      entitySlug: projectSlug,
      imageSlug,
      path: `images/${imageSlug}${extension}`,
      relativePath: normalizedPath,
      extension
    };
  }

  if (parts[0] === "album-covers" && parts.length === 5 && parts[3] === "singles") {
    const stripped = stripTrackSuffix(stripTrackPrefix(normalizeSlug(fileName)));
    const trackSlug = TRACK_ALIAS_BY_SLUG.get(stripped) ?? stripped;
    return {
      entityType: "track",
      entitySlug: trackSlug,
      imageSlug: trackSlug,
      path: `images/${trackSlug}${extension}`,
      relativePath: normalizedPath,
      extension
    };
  }

  throw new Error(`Unsupported image location: ${normalizedPath}`);
}

function collectSourceFiles(sourceDir) {
  const files = [];

  function walk(currentDir) {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        walk(fullPath);
        continue;
      }
      if (!entry.isFile()) {
        continue;
      }
      files.push(fullPath);
    }
  }

  walk(sourceDir);
  return files.sort((left, right) => left.localeCompare(right));
}

async function validateTargets(d1, mappings) {
  const artistSlugs = [...new Set(mappings.filter((item) => item.entityType === "artist").map((item) => item.entitySlug))];
  const projectSlugs = [...new Set(mappings.filter((item) => item.entityType === "project").map((item) => item.entitySlug))];
  const trackSlugs = [...new Set(mappings.filter((item) => item.entityType === "track").map((item) => item.entitySlug))];

  async function fetchExisting(table, slugs) {
    if (slugs.length === 0) {
      return new Set();
    }
    const placeholders = slugs.map(() => "?").join(", ");
    const rows = await d1.query(`SELECT slug FROM ${table} WHERE slug IN (${placeholders});`, slugs);
    return new Set(rows.map((row) => row.slug));
  }

  const [existingArtists, existingProjects, existingTracks] = await Promise.all([
    fetchExisting("artists", artistSlugs),
    fetchExisting("projects", projectSlugs),
    fetchExisting("tracks", trackSlugs)
  ]);

  const issues = [];
  for (const mapping of mappings) {
    if (mapping.entityType === "artist" && !existingArtists.has(mapping.entitySlug)) {
      issues.push(`Missing artist slug in D1: ${mapping.entitySlug}`);
    }
    if (mapping.entityType === "project" && !existingProjects.has(mapping.entitySlug)) {
      issues.push(`Missing project slug in D1: ${mapping.entitySlug}`);
    }
    if (mapping.entityType === "track" && !existingTracks.has(mapping.entitySlug)) {
      issues.push(`Missing track slug in D1: ${mapping.entitySlug}`);
    }
  }

  return issues;
}

async function uploadToR2(r2, mapping, sourceDir) {
  const body = fs.readFileSync(path.join(sourceDir, mapping.relativePath));
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: mapping.path,
      Body: body,
      ContentType: contentTypeForExtension(mapping.extension)
    })
  );
}

async function upsertImageRows(d1, mapping) {
  await d1.query(
    `
    INSERT INTO images (slug, path)
    VALUES (?, ?)
    ON CONFLICT(slug) DO UPDATE SET
      path = excluded.path;
    `,
    [mapping.imageSlug, mapping.path]
  );

  if (mapping.entityType === "artist") {
    await d1.query(
      `
      INSERT OR IGNORE INTO artist_images (artist_slug, image_slug)
      VALUES (?, ?);
      `,
      [mapping.entitySlug, mapping.imageSlug]
    );
    return;
  }

  if (mapping.entityType === "project") {
    await d1.query(
      `
      INSERT OR IGNORE INTO project_images (project_slug, image_slug)
      VALUES (?, ?);
      `,
      [mapping.entitySlug, mapping.imageSlug]
    );
    return;
  }

  await d1.query(
    `
    INSERT OR IGNORE INTO track_images (track_slug, image_slug)
    VALUES (?, ?);
    `,
    [mapping.entitySlug, mapping.imageSlug]
  );
}

async function main() {
  if (!fs.existsSync(SOURCE_DIR)) {
    throw new Error(`Image source directory not found: ${SOURCE_DIR}`);
  }

  const sourceFiles = collectSourceFiles(SOURCE_DIR);
  const mappings = [];
  const issues = [];
  const imageSlugToSource = new Map();
  const pathToSource = new Map();

  for (const fullPath of sourceFiles) {
    const relativePath = path.relative(SOURCE_DIR, fullPath);
    try {
      const mapping = inferMapping(relativePath);
      if (imageSlugToSource.has(mapping.imageSlug)) {
        issues.push(
          `Duplicate image slug "${mapping.imageSlug}" for ${mapping.relativePath} and ${imageSlugToSource.get(mapping.imageSlug)}`
        );
        continue;
      }
      if (pathToSource.has(mapping.path)) {
        issues.push(
          `Duplicate R2 path "${mapping.path}" for ${mapping.relativePath} and ${pathToSource.get(mapping.path)}`
        );
        continue;
      }
      imageSlugToSource.set(mapping.imageSlug, mapping.relativePath);
      pathToSource.set(mapping.path, mapping.relativePath);
      mappings.push(mapping);
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
    }
  }

  const counts = {
    artist: mappings.filter((item) => item.entityType === "artist").length,
    project: mappings.filter((item) => item.entityType === "project").length,
    track: mappings.filter((item) => item.entityType === "track").length,
    total: mappings.length
  };

  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  console.log(`Source dir: ${SOURCE_DIR}`);
  console.log(`Artist images: ${counts.artist}`);
  console.log(`Project images: ${counts.project}`);
  console.log(`Track images: ${counts.track}`);
  console.log(`Total images: ${counts.total}`);
  console.log(`Issues: ${issues.length}`);

  const preview = mappings
    .slice(0, 12)
    .map((item) => `${item.entityType}:${item.entitySlug} <- ${item.relativePath} -> ${item.path}`);
  if (preview.length > 0) {
    console.log("\nPreview:");
    for (const line of preview) {
      console.log(`- ${line}`);
    }
  }

  if (!EXECUTE) {
    if (issues.length > 0) {
      console.log("\nIssues:");
      for (const issue of issues) {
        console.log(`- ${issue}`);
      }
      process.exitCode = 1;
      return;
    }

    console.log("\nDry run complete. Re-run with --execute to upload to R2 and upsert D1 image rows.");
    return;
  }

  loadEnv();
  const d1 = createD1Client();
  const r2 = createR2Client();
  const validationIssues = await validateTargets(d1, mappings);
  issues.push(...validationIssues);

  if (issues.length > 0) {
    console.log("\nIssues:");
    for (const issue of issues) {
      console.log(`- ${issue}`);
    }
    process.exitCode = 1;
    return;
  }

  let uploaded = 0;
  let upserted = 0;

  for (const mapping of mappings) {
    await uploadToR2(r2, mapping, SOURCE_DIR);
    uploaded += 1;
    await upsertImageRows(d1, mapping);
    upserted += 1;
  }

  console.log(`\nUploaded to R2: ${uploaded}`);
  console.log(`Upserted D1 image mappings: ${upserted}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
