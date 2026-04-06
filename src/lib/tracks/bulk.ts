export interface TrackRelationState {
  artistSlugs: string[];
  projectSlugs: string[];
  tagSlugs: string[];
}

export interface SlugDelta {
  add: string[];
  remove: string[];
}

export interface TrackBulkMetadataOperation {
  trackSlugs: string[];
  artists: SlugDelta;
  projects: SlugDelta;
  tags: SlugDelta;
}

export const EMPTY_SLUG_DELTA: SlugDelta = {
  add: [],
  remove: []
};

function unique(values: string[]): string[] {
  return Array.from(new Set(values));
}

export function hasOverlappingSlugDelta(delta: SlugDelta): boolean {
  const removeSet = new Set(delta.remove);
  return delta.add.some((value) => removeSet.has(value));
}

export function normalizeSlugDelta(delta?: Partial<SlugDelta> | null): SlugDelta {
  return {
    add: unique((delta?.add ?? []).map((value) => value.trim()).filter(Boolean)),
    remove: unique((delta?.remove ?? []).map((value) => value.trim()).filter(Boolean))
  };
}

export function hasBulkMetadataChanges(operation: TrackBulkMetadataOperation): boolean {
  return (
    operation.artists.add.length > 0 ||
    operation.artists.remove.length > 0 ||
    operation.projects.add.length > 0 ||
    operation.projects.remove.length > 0 ||
    operation.tags.add.length > 0 ||
    operation.tags.remove.length > 0
  );
}

export function applySlugDelta(current: string[], delta: SlugDelta): string[] {
  const removeSet = new Set(delta.remove);
  const next = current.filter((value) => !removeSet.has(value));

  for (const value of delta.add) {
    if (!next.includes(value)) {
      next.push(value);
    }
  }

  return next;
}

export function applyTrackBulkMetadataOperation(
  current: TrackRelationState,
  operation: Pick<TrackBulkMetadataOperation, "artists" | "projects" | "tags">
): TrackRelationState {
  return {
    artistSlugs: applySlugDelta(current.artistSlugs, operation.artists),
    projectSlugs: applySlugDelta(current.projectSlugs, operation.projects),
    tagSlugs: applySlugDelta(current.tagSlugs, operation.tags)
  };
}
