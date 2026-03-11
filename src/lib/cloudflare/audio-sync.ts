import { parseR2AudioMetadata } from "@/lib/audio/r2-audio-metadata";
import { queryD1 } from "@/lib/cloudflare/d1";
import { listTrackAudioFilesFromR2 } from "@/lib/cloudflare/track-audio-files";

interface AudioRow {
  slug: string;
  type: string;
  typeVersion: number | string;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

interface DesiredAudioRow {
  slug: string;
  type: "note" | "demo" | "live";
  typeVersion: number;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

export interface TrackAudioSyncResult {
  parsed: number;
  inserted: number;
  updated: number;
  deleted: number;
  unchanged: number;
  adjustedVersions: number;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function rowsEqual(existing: AudioRow, desired: DesiredAudioRow): boolean {
  return (
    existing.type === desired.type &&
    Number(existing.typeVersion) === desired.typeVersion &&
    normalizeNullableText(existing.description) === normalizeNullableText(desired.description) &&
    existing.date === desired.date &&
    normalizeNullableText(existing.dateOverride) === normalizeNullableText(desired.dateOverride)
  );
}

function normalizeTypeVersions(
  rows: DesiredAudioRow[]
): { normalized: DesiredAudioRow[]; adjustedVersions: number } {
  const byType = new Map<DesiredAudioRow["type"], DesiredAudioRow[]>();
  for (const row of rows) {
    const bucket = byType.get(row.type) ?? [];
    bucket.push(row);
    byType.set(row.type, bucket);
  }

  let adjustedVersions = 0;
  const normalized: DesiredAudioRow[] = [];
  for (const [type, bucket] of byType) {
    bucket.sort((left, right) => {
      if (left.typeVersion !== right.typeVersion) {
        return left.typeVersion - right.typeVersion;
      }
      return left.slug.localeCompare(right.slug);
    });
    let nextVersion = bucket.reduce((max, row) => Math.max(max, row.typeVersion), 0) + 1;
    const seenVersions = new Set<number>();

    for (const row of bucket) {
      if (seenVersions.has(row.typeVersion)) {
        normalized.push({ ...row, type, typeVersion: nextVersion });
        seenVersions.add(nextVersion);
        nextVersion += 1;
        adjustedVersions += 1;
        continue;
      }
      normalized.push(row);
      seenVersions.add(row.typeVersion);
    }
  }

  normalized.sort((left, right) => left.slug.localeCompare(right.slug));
  return { normalized, adjustedVersions };
}

export async function syncTrackAudioMetadataFromR2(trackSlug: string): Promise<TrackAudioSyncResult> {
  const files = await listTrackAudioFilesFromR2(trackSlug);
  const desired = files.map((file) => parseR2AudioMetadata(trackSlug, file.fileName));
  const { normalized: desiredRows, adjustedVersions } = normalizeTypeVersions(desired);

  const existingRows = await queryD1<AudioRow>(
    `
    SELECT
      slug,
      type,
      type_version AS typeVersion,
      description,
      date,
      date_override AS dateOverride
    FROM audio
    WHERE track_slug = ?;
    `,
    [trackSlug]
  );

  const desiredBySlug = new Map(desiredRows.map((row) => [row.slug, row]));
  const existingBySlug = new Map(existingRows.map((row) => [row.slug, row]));
  const staleSlugs = existingRows
    .map((row) => row.slug)
    .filter((slug) => !desiredBySlug.has(slug));

  if (staleSlugs.length > 0) {
    const placeholders = staleSlugs.map(() => "?").join(", ");
    await queryD1(`DELETE FROM audio WHERE track_slug = ? AND slug IN (${placeholders});`, [
      trackSlug,
      ...staleSlugs
    ]);
  }

  let inserted = 0;
  let updated = 0;
  let unchanged = 0;
  for (const row of desiredRows) {
    const existing = existingBySlug.get(row.slug);
    if (existing && rowsEqual(existing, row)) {
      unchanged += 1;
      continue;
    }

    await queryD1(
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

    if (existing) {
      updated += 1;
    } else {
      inserted += 1;
    }
  }

  return {
    parsed: desiredRows.length,
    inserted,
    updated,
    deleted: staleSlugs.length,
    unchanged,
    adjustedVersions
  };
}
