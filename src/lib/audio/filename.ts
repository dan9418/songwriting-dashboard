import { ensureNonEmptySlug } from "@/lib/utils/slug";

const MP3_EXTENSION = ".mp3";
const AUDIO_FILENAME_REGEX =
  /^(?<trackName>.+?) - (?<category>[a-zA-Z][a-zA-Z0-9-]*) (?<versionNumber>\d+) \((?<recordedDate>\d{2}-\d{2}-\d{2})\)(?: \[(?<description>[^\]]+)\])?\.mp3$/;

export interface ParsedAudioFilename {
  trackName: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
  slug: string;
  originalFileName: string;
}

function isValidDateToken(dateToken: string): boolean {
  const [monthStr, dayStr, yearStr] = dateToken.split("-");
  const month = Number(monthStr);
  const day = Number(dayStr);
  const year = Number(yearStr);

  if (!Number.isInteger(month) || !Number.isInteger(day) || !Number.isInteger(year)) {
    return false;
  }
  if (month < 1 || month > 12) {
    return false;
  }

  const fullYear = year >= 70 ? 1900 + year : 2000 + year;
  const date = new Date(Date.UTC(fullYear, month - 1, day));
  return (
    date.getUTCFullYear() === fullYear &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function buildAudioSlug(input: Omit<ParsedAudioFilename, "slug" | "originalFileName">): string {
  return ensureNonEmptySlug(
    `${input.trackName}-${input.category}-${input.versionNumber}-${input.recordedDate}`
  );
}

export function parseAudioFilename(fileName: string): ParsedAudioFilename {
  const match = AUDIO_FILENAME_REGEX.exec(fileName);
  if (!match?.groups) {
    throw new Error(
      "Invalid filename. Expected: {Track Name} - {category} {versionNumber} ({MM-DD-YY}) [optionalDescription].mp3"
    );
  }

  const parsed: Omit<ParsedAudioFilename, "slug" | "originalFileName"> = {
    trackName: match.groups.trackName.trim(),
    category: match.groups.category.toLowerCase(),
    versionNumber: Number(match.groups.versionNumber),
    recordedDate: match.groups.recordedDate,
    description: match.groups.description?.trim()
  };

  if (!isValidDateToken(parsed.recordedDate)) {
    throw new Error("Invalid date in filename. Use a real calendar date in MM-DD-YY format.");
  }
  if (!Number.isInteger(parsed.versionNumber) || parsed.versionNumber < 1) {
    throw new Error("versionNumber must be a positive integer.");
  }

  return {
    ...parsed,
    slug: buildAudioSlug(parsed),
    originalFileName: fileName
  };
}

export function isValidAudioFilename(fileName: string): boolean {
  try {
    parseAudioFilename(fileName);
    return true;
  } catch {
    return false;
  }
}

export function formatAudioFilename(input: {
  trackName: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
}): string {
  if (!input.trackName.trim()) {
    throw new Error("trackName is required.");
  }
  if (!/^[a-zA-Z][a-zA-Z0-9-]*$/.test(input.category)) {
    throw new Error("category must be alphanumeric and may include hyphens.");
  }
  if (!Number.isInteger(input.versionNumber) || input.versionNumber < 1) {
    throw new Error("versionNumber must be a positive integer.");
  }
  if (!isValidDateToken(input.recordedDate)) {
    throw new Error("recordedDate must be a valid MM-DD-YY date.");
  }

  const descriptionToken = input.description?.trim()
    ? ` [${input.description.trim().replace(/[\[\]]/g, "")}]`
    : "";
  return `${input.trackName.trim()} - ${input.category.toLowerCase()} ${input.versionNumber} (${input.recordedDate})${descriptionToken}${MP3_EXTENSION}`;
}

export function renameAudioFilename(
  previousFileName: string,
  nextMetadata: {
    trackName: string;
    category: string;
    versionNumber: number;
    recordedDate: string;
    description?: string;
  }
): { shouldRename: boolean; nextFileName: string } {
  const nextFileName = formatAudioFilename(nextMetadata);
  return {
    shouldRename: previousFileName !== nextFileName,
    nextFileName
  };
}

