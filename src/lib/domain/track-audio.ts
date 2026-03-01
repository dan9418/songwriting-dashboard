import {
  formatAudioFilename,
  parseAudioFilename,
  renameAudioFilename
} from "@/lib/audio/filename";
import { badRequest } from "@/lib/api/errors";
import { trackSchema, type TrackFrontmatter } from "@/lib/domain/schemas";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

export function enforceTrackAudioNaming(input: unknown): TrackFrontmatter {
  const track = trackSchema.parse(input);
  const normalizedVersions = track.audioVersions.map((version) => {
    const parsed = parseAudioFilename(version.fileName);
    if (
      parsed.category !== version.category.toLowerCase() ||
      parsed.versionNumber !== version.versionNumber ||
      parsed.recordedDate !== version.recordedDate
    ) {
      throw badRequest(
        `Audio metadata mismatch for ${version.fileName}. fileName must match category/versionNumber/recordedDate.`
      );
    }

    const expectedFileName = formatAudioFilename({
      trackName: track.title,
      category: version.category,
      versionNumber: version.versionNumber,
      recordedDate: version.recordedDate,
      description: version.description
    });
    const renamed = renameAudioFilename(version.fileName, {
      trackName: track.title,
      category: version.category,
      versionNumber: version.versionNumber,
      recordedDate: version.recordedDate,
      description: version.description
    });

    return {
      ...version,
      fileName: renamed.shouldRename ? expectedFileName : version.fileName,
      slug: ensureNonEmptySlug(
        `${track.title}-${version.category}-${version.versionNumber}-${version.recordedDate}`
      )
    };
  });

  return {
    ...track,
    audioVersions: normalizedVersions
  };
}
