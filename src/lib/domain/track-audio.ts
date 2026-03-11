import {
  formatAudioFilename,
  parseAudioFilename,
  renameAudioFilename
} from "@/lib/audio/filename";
import { badRequest } from "@/lib/api/errors";
import { trackSchema, type TrackFrontmatter } from "@/lib/domain/schemas";

export function enforceTrackAudioNaming(input: unknown): TrackFrontmatter {
  const track = trackSchema.parse(input);
  const normalizedVersions = track.audioVersions.map((version) => {
    const parsed = parseAudioFilename(version.fileName);
    if (parsed.trackSlug !== track.slug) {
      throw badRequest(
        `Audio filename track slug mismatch for ${version.fileName}. Expected track slug "${track.slug}".`
      );
    }
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
      trackSlug: track.slug,
      category: version.category,
      versionNumber: version.versionNumber,
      recordedDate: version.recordedDate,
      description: version.description,
      extension: parsed.extension
    });
    const renamed = renameAudioFilename(version.fileName, {
      trackSlug: track.slug,
      category: version.category,
      versionNumber: version.versionNumber,
      recordedDate: version.recordedDate,
      description: version.description,
      extension: parsed.extension
    });
    const normalizedFileName = renamed.shouldRename ? expectedFileName : version.fileName;
    const normalizedParsed = parseAudioFilename(normalizedFileName);

    return {
      ...version,
      fileName: normalizedFileName,
      slug: normalizedParsed.slug
    };
  });

  return {
    ...track,
    audioVersions: normalizedVersions
  };
}
