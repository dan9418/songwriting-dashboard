import { listObjectKeys } from "@/lib/cloudflare/r2";

export interface TrackAudioFile {
  slug: string;
  fileName: string;
  key: string;
}

function fileNameFromKey(key: string): string | null {
  const parts = key.split("/");
  const fileName = parts[parts.length - 1] ?? "";
  if (!fileName || fileName.endsWith("/")) {
    return null;
  }
  return fileName;
}

function parseTrackAudioFile(key: string): TrackAudioFile | null {
  const fileName = fileNameFromKey(key);
  if (!fileName) {
    return null;
  }

  const dotIndex = fileName.lastIndexOf(".");
  const slug = dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName;
  return {
    slug,
    fileName,
    key
  };
}

export async function listTrackAudioFilesFromR2(
  trackSlug: string
): Promise<TrackAudioFile[]> {
  const prefix = `tracks/${trackSlug}/audio/`;
  const allKeys = await listObjectKeys(prefix);

  return allKeys
    .map((key) => parseTrackAudioFile(key))
    .filter((item): item is TrackAudioFile => item !== null);
}

export async function getTrackAudioFileFromR2(
  trackSlug: string,
  audioSlug: string
): Promise<TrackAudioFile | null> {
  const files = await listTrackAudioFilesFromR2(trackSlug);
  const match = files.find((item) => item.slug === audioSlug);
  return match ?? null;
}
