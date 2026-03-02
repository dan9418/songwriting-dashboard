import { ensureNonEmptySlug } from "@/lib/utils/slug";

const AUDIO_EXTENSIONS = [".mp3", ".m4a"] as const;
type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];
const STRICT_DATE_TOKEN_REGEX = /^\d{1,2}-\d{1,2}-\d{2}$/;
const DATE_DESCRIPTOR_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 '&.,/-]*$/;
const AUDIO_FILENAME_REGEX =
  /^(?<trackName>.+?) - (?<category>[a-zA-Z][a-zA-Z0-9-]*) (?<versionNumber>\d+) \((?<recordedDate>[^)]+)\)(?: \[(?<description>[^\]]+)\])?(?<extension>\.mp3|\.m4a)$/;

export interface ParsedAudioFilename {
  trackName: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
  extension: AudioExtension;
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

function isValidRecordedDateToken(dateToken: string): boolean {
  const normalizedToken = dateToken.trim();
  if (!normalizedToken) {
    return false;
  }
  if (STRICT_DATE_TOKEN_REGEX.test(normalizedToken)) {
    return isValidDateToken(normalizedToken);
  }
  return DATE_DESCRIPTOR_REGEX.test(normalizedToken);
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
      "Invalid filename. Expected: {Track Name} - {category} {versionNumber} ({M-D-YY|descriptor}) [optionalDescription].{mp3|m4a}"
    );
  }

  const parsed: Omit<ParsedAudioFilename, "slug" | "originalFileName"> = {
    trackName: match.groups.trackName.trim(),
    category: match.groups.category.toLowerCase(),
    versionNumber: Number(match.groups.versionNumber),
    recordedDate: match.groups.recordedDate.trim(),
    description: match.groups.description?.trim(),
    extension: match.groups.extension.toLowerCase() as AudioExtension
  };

  if (!isValidRecordedDateToken(parsed.recordedDate)) {
    throw new Error("Invalid date token in filename. Use M-D-YY or a descriptor string.");
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
  extension?: string;
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
  if (!isValidRecordedDateToken(input.recordedDate)) {
    throw new Error("recordedDate must be M-D-YY or a descriptor string.");
  }
  const extension = (input.extension ?? ".mp3").toLowerCase();
  if (!AUDIO_EXTENSIONS.includes(extension as AudioExtension)) {
    throw new Error("extension must be .mp3 or .m4a");
  }

  const descriptionToken = input.description?.trim()
    ? ` [${input.description.trim().replace(/[\[\]]/g, "")}]`
    : "";
  return `${input.trackName.trim()} - ${input.category.toLowerCase()} ${input.versionNumber} (${input.recordedDate})${descriptionToken}${extension}`;
}

export function renameAudioFilename(
  previousFileName: string,
  nextMetadata: {
    trackName: string;
    category: string;
    versionNumber: number;
    recordedDate: string;
    description?: string;
    extension?: string;
  }
): { shouldRename: boolean; nextFileName: string } {
  const nextFileName = formatAudioFilename(nextMetadata);
  return {
    shouldRename: previousFileName !== nextFileName,
    nextFileName
  };
}
