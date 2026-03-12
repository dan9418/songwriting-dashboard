import { conflict } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface SlugRow {
  slug: string;
}

export interface CreatedEntityRecord {
  slug: string;
  name: string;
}

async function assertSlugAvailable(table: "artists" | "projects" | "tracks", slug: string) {
  const rows = await queryD1<SlugRow>(`SELECT slug FROM ${table} WHERE slug = ? LIMIT 1;`, [slug]);
  if (rows.length > 0) {
    throw conflict(`${table.slice(0, -1).replace(/^\w/, (char) => char.toUpperCase())} "${slug}" already exists.`);
  }
}

export async function createArtistInCloudflare(name: string): Promise<CreatedEntityRecord> {
  const trimmedName = name.trim();
  const slug = ensureNonEmptySlug(trimmedName);
  await assertSlugAvailable("artists", slug);
  await queryD1(`INSERT INTO artists (slug, name, description) VALUES (?, ?, '');`, [slug, trimmedName]);
  return { slug, name: trimmedName };
}

export async function createProjectInCloudflare(name: string): Promise<CreatedEntityRecord> {
  const trimmedName = name.trim();
  const slug = ensureNonEmptySlug(trimmedName);
  await assertSlugAvailable("projects", slug);
  await queryD1(
    `INSERT INTO projects (slug, name, description, type, release_date, remaster_date) VALUES (?, ?, '', 'single', NULL, NULL);`,
    [slug, trimmedName]
  );
  return { slug, name: trimmedName };
}

export async function createTrackInCloudflare(name: string): Promise<CreatedEntityRecord> {
  const trimmedName = name.trim();
  const slug = ensureNonEmptySlug(trimmedName);
  await assertSlugAvailable("tracks", slug);
  await queryD1(`INSERT INTO tracks (slug, name) VALUES (?, ?);`, [slug, trimmedName]);
  return { slug, name: trimmedName };
}
