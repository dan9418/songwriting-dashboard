const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".mp4"] as const;
type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];
const STRICT_DATE_TOKEN_REGEX = /^\d{1,2}-\d{1,2}-\d{2}$/;
const DATE_DESCRIPTOR_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9 '&.,/-]*$/;
const TRACK_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const AUDIO_FILENAME_REGEX =
  /^(?<trackSlug>[a-z0-9]+(?:-[a-z0-9]+)*)_(?<category>[a-zA-Z][a-zA-Z0-9-]*)_v(?<versionNumber>\d+)_(?<recordedDate>[^_]+?)(?:_(?<description>.+))?$/i;

export interface ParsedAudioFilename {
  trackSlug: string;
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
  if (normalizedToken.includes("_")) {
    return false;
  }
  if (STRICT_DATE_TOKEN_REGEX.test(normalizedToken)) {
    return isValidDateToken(normalizedToken);
  }
  return DATE_DESCRIPTOR_REGEX.test(normalizedToken);
}

export function parseAudioFilename(fileName: string): ParsedAudioFilename {
  const extensionMatch = /\.(mp3|m4a|mp4)$/i.exec(fileName);
  if (!extensionMatch) {
    throw new Error("Invalid filename extension. Expected .mp3, .m4a, or .mp4");
  }
  const extension = extensionMatch[0].toLowerCase() as AudioExtension;
  const baseName = fileName.slice(0, -extension.length);

  const match = AUDIO_FILENAME_REGEX.exec(baseName);
  if (!match?.groups) {
    throw new Error(
      "Invalid filename. Expected: {track-slug}_{category}_v{versionNumber}_{M-D-YY|descriptor|YYYY-MM-DD|YYYY}_{optionalDescription}.{mp3|m4a|mp4}"
    );
  }

  const parsed: Omit<ParsedAudioFilename, "slug" | "originalFileName"> = {
    trackSlug: match.groups.trackSlug.trim(),
    category: match.groups.category.toLowerCase(),
    versionNumber: Number(match.groups.versionNumber),
    recordedDate: match.groups.recordedDate.trim(),
    description: match.groups.description?.trim(),
    extension
  };

  if (!TRACK_SLUG_REGEX.test(parsed.trackSlug)) {
    throw new Error("trackSlug must be kebab-case.");
  }
  if (!isValidRecordedDateToken(parsed.recordedDate)) {
    throw new Error("Invalid date token in filename. Use M-D-YY or a descriptor string.");
  }
  if (!Number.isInteger(parsed.versionNumber) || parsed.versionNumber < 1) {
    throw new Error("versionNumber must be a positive integer.");
  }

  return {
    ...parsed,
    slug: baseName,
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
  trackSlug: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
  extension?: string;
}): string {
  const trackSlug = input.trackSlug.trim().toLowerCase();
  if (!TRACK_SLUG_REGEX.test(trackSlug)) {
    throw new Error("trackSlug must be kebab-case.");
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
    throw new Error("extension must be .mp3, .m4a, or .mp4");
  }

  const descriptionToken = input.description?.trim() ? `_${input.description.trim()}` : "";
  return `${trackSlug}_${input.category.toLowerCase()}_v${input.versionNumber}_${input.recordedDate.trim()}${descriptionToken}${extension}`;
}

export function renameAudioFilename(
  previousFileName: string,
  nextMetadata: {
    trackSlug: string;
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
