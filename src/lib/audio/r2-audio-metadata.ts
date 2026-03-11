import { parseAudioFilename } from "@/lib/audio/filename";

const ISO_DATE_TOKEN_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const LEGACY_DATE_TOKEN_REGEX = /^\d{1,2}-\d{1,2}-\d{2}$/;
const YEAR_TOKEN_REGEX = /^\d{4}$/;

export interface ParsedR2AudioMetadata {
  slug: string;
  type: "note" | "demo" | "live";
  typeVersion: number;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

function normalizeNullableText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toIsoDate(year: number, month: number, day: number): string | null {
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

export function parseDateTokenForAudioMetadata(rawToken: string): {
  date: string;
  dateOverride: string | null;
} {
  const token = rawToken.trim();
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

export function parseR2AudioMetadata(trackSlug: string, fileName: string): ParsedR2AudioMetadata {
  const parsed = parseAudioFilename(fileName);
  if (parsed.trackSlug !== trackSlug) {
    throw new Error(
      `Audio file track slug mismatch. Expected "${trackSlug}" but received "${parsed.trackSlug}" from filename: ${fileName}`
    );
  }
  if (!["note", "demo", "live"].includes(parsed.category)) {
    throw new Error(`Unsupported audio category "${parsed.category}" in filename: ${fileName}`);
  }
  const { date, dateOverride } = parseDateTokenForAudioMetadata(parsed.recordedDate);
  return {
    slug: parsed.slug,
    type: parsed.category as "note" | "demo" | "live",
    typeVersion: parsed.versionNumber,
    description: normalizeNullableText(parsed.description),
    date,
    dateOverride
  };
}
