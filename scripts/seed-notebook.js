const fs = require("fs");
const path = require("path");
const {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client
} = require("@aws-sdk/client-s3");

const NOTEBOOK_DIR = path.resolve("archive", "notebook");
const EXECUTE = process.argv.includes("--execute");

const DESCRIPTION_BY_FILE = {
  "human-architecture.md": "Long-form lyric sketches and sectioned song drafts.",
  "lyric-fragments.md": "Loose lyric scraps, fragments, and unfinished ideas.",
  "the-vectors.md": "Structured lyric drafts and song concepts from The Vectors.",
  "title-ideas.md": "Candidate titles for songs, projects, or bands."
};

const PAGE_TYPE_BY_FILE = {
  "human-architecture.md": "lyric-draft",
  "lyric-fragments.md": "lyric-fragments",
  "the-vectors.md": "lyric-draft",
  "title-ideas.md": "title-ideas"
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

function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[_\s]+/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+|-+$/g, "");
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function toYamlString(value) {
  return JSON.stringify(value);
}

function buildNotebookMarkdown(metadata, body) {
  const normalizedBody = body.replace(/\r\n/g, "\n").replace(/^\n+/, "");
  return [
    "---",
    `name: ${toYamlString(metadata.name)}`,
    `description: ${toYamlString(metadata.description)}`,
    `page_type: ${toYamlString(metadata.pageType)}`,
    `created: ${toYamlString(metadata.created)}`,
    `last_modified: ${toYamlString(metadata.lastModified)}`,
    "---",
    "",
    normalizedBody
  ].join("\n");
}

function collectPages() {
  return fs
    .readdirSync(NOTEBOOK_DIR, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
    .map((entry) => {
      const fullPath = path.join(NOTEBOOK_DIR, entry.name);
      const stat = fs.statSync(fullPath);
      const slug = slugify(entry.name);
      const timestamp = stat.mtime.toISOString();
      const body = fs.readFileSync(fullPath, "utf8");
      const description = DESCRIPTION_BY_FILE[entry.name];
      const pageType = PAGE_TYPE_BY_FILE[entry.name];

      if (!description || !pageType) {
        throw new Error(`Missing seed metadata mapping for ${entry.name}`);
      }

      return {
        slug,
        fileName: entry.name,
        name: titleFromSlug(slug),
        description,
        pageType,
        createdAt: timestamp,
        updatedAt: timestamp,
        storagePath: `notebook/pages/${slug}.md`,
        content: buildNotebookMarkdown(
          {
            name: titleFromSlug(slug),
            description,
            pageType,
            created: timestamp,
            lastModified: timestamp
          },
          body
        )
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

async function fetchExistingNotebookSlugs(d1, slugs) {
  if (slugs.length === 0) {
    return new Set();
  }

  const placeholders = slugs.map(() => "?").join(", ");
  const rows = await d1.query(
    `SELECT slug FROM notebook_pages WHERE slug IN (${placeholders});`,
    slugs
  );
  return new Set(rows.map((row) => row.slug));
}

async function uploadNotebookPage(r2, page) {
  await r2.client.send(
    new PutObjectCommand({
      Bucket: r2.bucket,
      Key: page.storagePath,
      Body: page.content,
      ContentType: "text/markdown; charset=utf-8"
    })
  );
}

async function deleteNotebookObject(r2, storagePath) {
  await r2.client.send(
    new DeleteObjectCommand({
      Bucket: r2.bucket,
      Key: storagePath
    })
  );
}

async function insertNotebookRow(d1, page) {
  await d1.query(
    `
    INSERT INTO notebook_pages (
      slug,
      name,
      description,
      page_type,
      storage_path,
      created_at,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?);
    `,
    [
      page.slug,
      page.name,
      page.description,
      page.pageType,
      page.storagePath,
      page.createdAt,
      page.updatedAt
    ]
  );
}

async function main() {
  if (!fs.existsSync(NOTEBOOK_DIR)) {
    throw new Error(`Notebook source directory not found: ${NOTEBOOK_DIR}`);
  }

  const pages = collectPages();
  console.log(`Mode: ${EXECUTE ? "execute" : "dry-run"}`);
  console.log(`Notebook source: ${NOTEBOOK_DIR}`);
  console.log(`Pages discovered: ${pages.length}`);

  for (const page of pages) {
    console.log(`- ${page.slug} -> ${page.storagePath} (${page.pageType})`);
  }

  if (!EXECUTE) {
    console.log("\nDry run complete. Re-run with --execute to upload notebook pages to R2 and insert D1 metadata rows.");
    return;
  }

  loadEnv();
  const d1 = createD1Client();
  const r2 = createR2Client();
  const existingSlugs = await fetchExistingNotebookSlugs(
    d1,
    pages.map((page) => page.slug)
  );

  let createdCount = 0;
  let skippedCount = 0;

  for (const page of pages) {
    if (existingSlugs.has(page.slug)) {
      skippedCount += 1;
      console.log(`Skipping existing page: ${page.slug}`);
      continue;
    }

    await uploadNotebookPage(r2, page);
    try {
      await insertNotebookRow(d1, page);
    } catch (error) {
      await deleteNotebookObject(r2, page.storagePath).catch(() => undefined);
      throw error;
    }

    createdCount += 1;
    console.log(`Seeded notebook page: ${page.slug}`);
  }

  console.log(`\nCreated pages: ${createdCount}`);
  console.log(`Skipped existing pages: ${skippedCount}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
