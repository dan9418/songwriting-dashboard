const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCE_URL =
  "https://raw.githubusercontent.com/dan9418/personal-site-6/refs/heads/master/src/data/music.data.ts";
const EXECUTE = process.argv.includes("--execute");
const TRACK_SLUG_ALIASES = new Map([["d-a-m", "dam"]]);
const WORD_OVERRIDES = new Map([
  ["dont", "Don't"],
  ["cant", "Can't"],
  ["doesnt", "Doesn't"],
  ["heres", "Here's"]
]);
const SLUG_NAME_OVERRIDES = new Map([
  ["bill-murrays-boat", "Bill Murray's Boat"],
  ["chigurhs-coin", "Chigurh's Coin"]
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

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to fetch ${url}: HTTP ${response.statusCode}`));
          response.resume();
          return;
        }

        let data = "";
        response.setEncoding("utf8");
        response.on("data", (chunk) => {
          data += chunk;
        });
        response.on("end", () => resolve(data));
      })
      .on("error", reject);
  });
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function loadMusicData(source) {
  const withoutImports = source.replace(/^import\s[^;]+;\s*/gm, "");
  const rewritten = withoutImports
    .replace(
      /const\s+(DAN_BEDNARCZYK|JONAH|THE_VECTORS|OLD_PROJECTS)\s*:\s*IArtist\s*=/g,
      "const $1 ="
    )
    .replace(/const\s+MUSIC_DATA\s*:\s*IArtist\[\]\s*=/g, "const MUSIC_DATA =")
    .replace(/export\s+default\s+MUSIC_DATA\s*;?/g, "module.exports = MUSIC_DATA;");

  const wrapper = `
    const LINK_APPLE_MUSIC = { href: "" };
    const LINK_BANDCAMP = { href: "" };
    const LINK_INSTAGRAM = { href: "" };
    const LINK_SPOTIFY = { href: "" };
    const IconId = new Proxy({}, { get: (_, key) => String(key) });
    ${rewritten}
  `;

  const module = { exports: null };
  const fn = new Function("module", "exports", wrapper);
  fn(module, module.exports);
  return module.exports;
}

async function queryD1(sql, params = []) {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getRequiredEnv("CLOUDFLARE_API_TOKEN");

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
    throw new Error(`Cloudflare D1 request failed: ${JSON.stringify(payload)}`);
  }

  const firstResult = payload.result?.[0];
  if (!firstResult?.success) {
    throw new Error(firstResult?.error ?? "Cloudflare D1 query failed.");
  }

  return firstResult.results ?? [];
}

function buildSourceTrackNameMap(musicData) {
  const trackNames = new Map();

  for (const artist of musicData) {
    for (const album of artist.albums ?? []) {
      for (const track of album.tracks ?? []) {
        const rawTrackSlug = slugify(track.name);
        const trackSlug = TRACK_SLUG_ALIASES.get(rawTrackSlug) ?? rawTrackSlug;
        trackNames.set(trackSlug, track.name);
      }
    }
  }

  return trackNames;
}

function toCapitalizedWord(word) {
  if (!word) {
    return word;
  }
  if (/^\d+$/.test(word)) {
    return word;
  }
  const override = WORD_OVERRIDES.get(word);
  if (override) {
    return override;
  }
  return `${word.charAt(0).toUpperCase()}${word.slice(1)}`;
}

function inferTrackNameFromSlug(slug) {
  const override = SLUG_NAME_OVERRIDES.get(slug);
  if (override) {
    return override;
  }

  return slug
    .split("-")
    .map((part) => toCapitalizedWord(part))
    .join(" ");
}

async function main() {
  loadEnv();

  const source = await fetchText(SOURCE_URL);
  const musicData = loadMusicData(source);
  const sourceTrackNames = buildSourceTrackNameMap(musicData);
  const trackRows = await queryD1("SELECT slug, name FROM tracks ORDER BY slug ASC;");

  const updates = [];
  const sampleSourceUpdates = [];
  const sampleInferredUpdates = [];

  for (const row of trackRows) {
    const desiredName = sourceTrackNames.get(row.slug) ?? inferTrackNameFromSlug(row.slug);
    if (row.name === desiredName) {
      continue;
    }

    const update = {
      slug: row.slug,
      current: row.name,
      desired: desiredName,
      source: sourceTrackNames.has(row.slug) ? "music.data.ts" : "inferred"
    };
    updates.push(update);

    if (update.source === "music.data.ts" && sampleSourceUpdates.length < 20) {
      sampleSourceUpdates.push(update);
    }
    if (update.source === "inferred" && sampleInferredUpdates.length < 20) {
      sampleInferredUpdates.push(update);
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: EXECUTE ? "execute" : "dry-run",
        totalTracks: trackRows.length,
        updates: {
          total: updates.length,
          sourceBacked: updates.filter((update) => update.source === "music.data.ts").length,
          inferred: updates.filter((update) => update.source === "inferred").length
        },
        sampleSourceUpdates,
        sampleInferredUpdates
      },
      null,
      2
    )
  );

  if (!EXECUTE) {
    return;
  }

  for (const update of updates) {
    await queryD1(
      `
      UPDATE tracks
      SET name = ?
      WHERE slug = ?;
      `,
      [update.desired, update.slug]
    );
  }

  console.log(
    JSON.stringify(
      {
        updated: updates.length
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
