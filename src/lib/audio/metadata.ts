import { AUDIO_TYPES, type AudioType } from "@/lib/domain/models";

export const AUDIO_EXTENSIONS = [".mp3", ".m4a", ".mp4"] as const;
export type AudioExtension = (typeof AUDIO_EXTENSIONS)[number];

export function audioExtensionForFileName(fileName: string): AudioExtension | null {
  const match = /\.(mp3|m4a|mp4)$/i.exec(fileName);
  return match ? (match[0].toLowerCase() as AudioExtension) : null;
}

export function contentTypeForAudioExtension(extension: AudioExtension): string {
  if (extension === ".mp3") {
    return "audio/mpeg";
  }
  return "audio/mp4";
}

export function isAudioType(value: string): value is AudioType {
  return (AUDIO_TYPES as readonly string[]).includes(value);
}

export function buildAudioObjectKey(trackSlug: string, audioId: string, extension: AudioExtension): string {
  return `tracks/${trackSlug}/audio/${audioId}${extension}`;
}

export function defaultAudioName(type: AudioType, existingCountForType: number): string {
  return `${type} ${existingCountForType + 1}`;
}
