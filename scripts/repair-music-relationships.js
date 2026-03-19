const fs = require("fs");
const path = require("path");
const https = require("https");

const SOURCE_URL =
  "https://raw.githubusercontent.com/dan9418/personal-site-6/refs/heads/master/src/data/music.data.ts";
const EXECUTE = process.argv.includes("--execute");
const TRACK_SLUG_ALIASES = new Map([["d-a-m", "dam"]]);

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

function buildExpectedRelationships(musicData) {
  const projectArtistPairs = [];
  const trackProjectPairs = [];
  const trackArtistPairs = [];

  for (const artist of musicData) {
    const rawArtistSlug = slugify(artist.name);
    const artistSlug = rawArtistSlug === "old-projects" ? "dan-bednarczyk" : rawArtistSlug;

    for (const album of artist.albums ?? []) {
      const projectSlug = slugify(album.name);
      projectArtistPairs.push({ projectSlug, artistSlug });

      for (const [index, track] of (album.tracks ?? []).entries()) {
        const sourceTrackSlug = slugify(track.name);
        const trackSlug = TRACK_SLUG_ALIASES.get(sourceTrackSlug) ?? sourceTrackSlug;
        trackProjectPairs.push({
          trackSlug,
          projectSlug,
          position: index + 1
        });
        trackArtistPairs.push({ trackSlug, artistSlug });
      }
    }
  }

  return {
    projectArtistPairs,
    trackProjectPairs,
    trackArtistPairs
  };
}

function pairKey(left, right) {
  return `${left}::${right}`;
}

async function main() {
  loadEnv();

  const source = await fetchText(SOURCE_URL);
  const musicData = loadMusicData(source);
  const expected = buildExpectedRelationships(musicData);

  const [artistRows, projectRows, trackRows, projectArtistRows, projectTrackRows, trackArtistRows] =
    await Promise.all([
      queryD1("SELECT slug FROM artists ORDER BY slug ASC;"),
      queryD1("SELECT slug FROM projects ORDER BY slug ASC;"),
      queryD1("SELECT slug FROM tracks ORDER BY slug ASC;"),
      queryD1(
        `
        SELECT project_slug AS projectSlug, artist_slug AS artistSlug
        FROM project_artists;
        `
      ),
      queryD1(
        `
        SELECT project_slug AS projectSlug, track_slug AS trackSlug, position
        FROM project_tracks;
        `
      ),
      queryD1(
        `
        SELECT track_slug AS trackSlug, artist_slug AS artistSlug
        FROM track_artists;
        `
      )
    ]);

  const artistSlugs = new Set(artistRows.map((row) => row.slug));
  const projectSlugs = new Set(projectRows.map((row) => row.slug));
  const trackSlugs = new Set(trackRows.map((row) => row.slug));

  const missingArtists = Array.from(
    new Set(
      expected.projectArtistPairs
        .map((pair) => pair.artistSlug)
        .filter((artistSlug) => !artistSlugs.has(artistSlug))
    )
  ).sort();
  const missingProjects = Array.from(
    new Set(
      expected.projectArtistPairs
        .map((pair) => pair.projectSlug)
        .filter((projectSlug) => !projectSlugs.has(projectSlug))
    )
  ).sort();
  const missingTracks = Array.from(
    new Set(
      expected.trackProjectPairs
        .map((pair) => pair.trackSlug)
        .filter((trackSlug) => !trackSlugs.has(trackSlug))
    )
  ).sort();

  if (missingArtists.length > 0 || missingProjects.length > 0 || missingTracks.length > 0) {
    throw new Error(
      JSON.stringify(
        {
          missingArtists,
          missingProjects,
          missingTracks
        },
        null,
        2
      )
    );
  }

  const existingProjectArtists = new Set(
    projectArtistRows.map((row) => pairKey(row.projectSlug, row.artistSlug))
  );
  const existingProjectTracks = new Set(
    projectTrackRows.map((row) => pairKey(row.projectSlug, row.trackSlug))
  );
  const existingTrackArtists = new Set(
    trackArtistRows.map((row) => pairKey(row.trackSlug, row.artistSlug))
  );

  const missingProjectArtists = expected.projectArtistPairs.filter(
    (pair) => !existingProjectArtists.has(pairKey(pair.projectSlug, pair.artistSlug))
  );
  const missingProjectTracks = expected.trackProjectPairs.filter(
    (pair) => !existingProjectTracks.has(pairKey(pair.projectSlug, pair.trackSlug))
  );
  const missingTrackArtists = expected.trackArtistPairs.filter(
    (pair) => !existingTrackArtists.has(pairKey(pair.trackSlug, pair.artistSlug))
  );

  console.log(
    JSON.stringify(
      {
        mode: EXECUTE ? "execute" : "dry-run",
        expected: {
          projectArtists: expected.projectArtistPairs.length,
          projectTracks: expected.trackProjectPairs.length,
          trackArtists: expected.trackArtistPairs.length
        },
        existing: {
          projectArtists: projectArtistRows.length,
          projectTracks: projectTrackRows.length,
          trackArtists: trackArtistRows.length
        },
        missing: {
          projectArtists: missingProjectArtists.length,
          projectTracks: missingProjectTracks.length,
          trackArtists: missingTrackArtists.length
        },
        sampleMissingProjectTracks: missingProjectTracks.slice(0, 10),
        sampleMissingTrackArtists: missingTrackArtists.slice(0, 10)
      },
      null,
      2
    )
  );

  if (!EXECUTE) {
    return;
  }

  for (const pair of missingProjectArtists) {
    await queryD1(
      `
      INSERT INTO project_artists (project_slug, artist_slug)
      VALUES (?, ?)
      ON CONFLICT(project_slug, artist_slug) DO NOTHING;
      `,
      [pair.projectSlug, pair.artistSlug]
    );
  }

  for (const pair of missingProjectTracks) {
    await queryD1(
      `
      INSERT INTO project_tracks (project_slug, track_slug, position)
      VALUES (?, ?, ?)
      ON CONFLICT(project_slug, track_slug) DO UPDATE SET position = excluded.position;
      `,
      [pair.projectSlug, pair.trackSlug, pair.position]
    );
  }

  for (const pair of missingTrackArtists) {
    await queryD1(
      `
      INSERT INTO track_artists (track_slug, artist_slug)
      VALUES (?, ?)
      ON CONFLICT(track_slug, artist_slug) DO NOTHING;
      `,
      [pair.trackSlug, pair.artistSlug]
    );
  }

  console.log(
    JSON.stringify(
      {
        inserted: {
          projectArtists: missingProjectArtists.length,
          projectTracks: missingProjectTracks.length,
          trackArtists: missingTrackArtists.length
        }
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
