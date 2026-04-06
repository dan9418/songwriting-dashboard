import { apiErrorResponse, badRequest, notFound } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { trackBulkMetadataBodySchema } from "@/lib/domain/schemas";
import {
  applyTrackBulkMetadataOperation,
  hasBulkMetadataChanges,
  type TrackRelationState
} from "@/lib/tracks/bulk";

interface TrackSlugRow {
  slug: string;
}

interface TrackArtistRow {
  trackSlug: string;
  artistSlug: string;
}

interface TrackProjectRow {
  trackSlug: string;
  projectSlug: string;
}

interface TrackTagRow {
  trackSlug: string;
  tagSlug: string;
}

interface ProjectPositionRow {
  projectSlug: string;
  maxPosition: number | string | null;
}

function createPlaceholders(count: number): string {
  return Array.from({ length: count }, () => "?").join(", ");
}

function toInt(value: number | string | null): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value);
  }
  return 0;
}

function createInitialRelationMap(trackSlugs: string[]): Map<string, TrackRelationState> {
  return new Map(
    trackSlugs.map((trackSlug) => [
      trackSlug,
      {
        artistSlugs: [],
        projectSlugs: [],
        tagSlugs: []
      }
    ])
  );
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<Record<string, unknown>>(request);
    const payload = trackBulkMetadataBodySchema.parse(body);

    if (!hasBulkMetadataChanges(payload)) {
      throw badRequest("At least one bulk metadata change is required.");
    }

    const trackPlaceholders = createPlaceholders(payload.trackSlugs.length);
    const trackRows = await queryD1<TrackSlugRow>(
      `
      SELECT slug
      FROM tracks
      WHERE slug IN (${trackPlaceholders});
      `,
      payload.trackSlugs
    );
    const existingTrackSlugs = new Set(trackRows.map((row) => row.slug));
    const missingTrackSlugs = payload.trackSlugs.filter((trackSlug) => !existingTrackSlugs.has(trackSlug));

    if (missingTrackSlugs.length > 0) {
      throw notFound(`Tracks not found: ${missingTrackSlugs.join(", ")}`);
    }

    const [artistRows, projectRows, tagRows] = await Promise.all([
      queryD1<TrackArtistRow>(
        `
        SELECT
          track_slug AS trackSlug,
          artist_slug AS artistSlug
        FROM track_artists
        WHERE track_slug IN (${trackPlaceholders});
        `,
        payload.trackSlugs
      ),
      queryD1<TrackProjectRow>(
        `
        SELECT
          track_slug AS trackSlug,
          project_slug AS projectSlug
        FROM project_tracks
        WHERE track_slug IN (${trackPlaceholders})
        ORDER BY project_slug ASC, position ASC, track_slug ASC;
        `,
        payload.trackSlugs
      ),
      queryD1<TrackTagRow>(
        `
        SELECT
          track_slug AS trackSlug,
          tag_slug AS tagSlug
        FROM track_tags
        WHERE track_slug IN (${trackPlaceholders});
        `,
        payload.trackSlugs
      )
    ]);

    const currentByTrack = createInitialRelationMap(payload.trackSlugs);

    for (const row of artistRows) {
      currentByTrack.get(row.trackSlug)?.artistSlugs.push(row.artistSlug);
    }
    for (const row of projectRows) {
      currentByTrack.get(row.trackSlug)?.projectSlugs.push(row.projectSlug);
    }
    for (const row of tagRows) {
      currentByTrack.get(row.trackSlug)?.tagSlugs.push(row.tagSlug);
    }

    const artistDeletes: Array<{ trackSlug: string; artistSlug: string }> = [];
    const artistAdds: Array<{ trackSlug: string; artistSlug: string }> = [];
    const projectDeletes: Array<{ trackSlug: string; projectSlug: string }> = [];
    const projectAdds: Array<{ trackSlug: string; projectSlug: string }> = [];
    const tagDeletes: Array<{ trackSlug: string; tagSlug: string }> = [];
    const tagAdds: Array<{ trackSlug: string; tagSlug: string }> = [];

    for (const trackSlug of payload.trackSlugs) {
      const current = currentByTrack.get(trackSlug);
      if (!current) {
        continue;
      }

      const next = applyTrackBulkMetadataOperation(current, payload);
      const currentArtists = new Set(current.artistSlugs);
      const nextArtists = new Set(next.artistSlugs);
      const currentProjects = new Set(current.projectSlugs);
      const nextProjects = new Set(next.projectSlugs);
      const currentTags = new Set(current.tagSlugs);
      const nextTags = new Set(next.tagSlugs);

      for (const artistSlug of current.artistSlugs) {
        if (!nextArtists.has(artistSlug)) {
          artistDeletes.push({ trackSlug, artistSlug });
        }
      }
      for (const artistSlug of next.artistSlugs) {
        if (!currentArtists.has(artistSlug)) {
          artistAdds.push({ trackSlug, artistSlug });
        }
      }

      for (const projectSlug of current.projectSlugs) {
        if (!nextProjects.has(projectSlug)) {
          projectDeletes.push({ trackSlug, projectSlug });
        }
      }
      for (const projectSlug of next.projectSlugs) {
        if (!currentProjects.has(projectSlug)) {
          projectAdds.push({ trackSlug, projectSlug });
        }
      }

      for (const tagSlug of current.tagSlugs) {
        if (!nextTags.has(tagSlug)) {
          tagDeletes.push({ trackSlug, tagSlug });
        }
      }
      for (const tagSlug of next.tagSlugs) {
        if (!currentTags.has(tagSlug)) {
          tagAdds.push({ trackSlug, tagSlug });
        }
      }
    }

    for (const item of artistDeletes) {
      await queryD1(`DELETE FROM track_artists WHERE track_slug = ? AND artist_slug = ?;`, [
        item.trackSlug,
        item.artistSlug
      ]);
    }
    for (const item of artistAdds) {
      await queryD1(
        `
        INSERT INTO track_artists (track_slug, artist_slug)
        VALUES (?, ?)
        ON CONFLICT(track_slug, artist_slug) DO NOTHING;
        `,
        [item.trackSlug, item.artistSlug]
      );
    }

    for (const item of projectDeletes) {
      await queryD1(`DELETE FROM project_tracks WHERE track_slug = ? AND project_slug = ?;`, [
        item.trackSlug,
        item.projectSlug
      ]);
    }

    const uniqueProjectsToAdd = Array.from(new Set(projectAdds.map((item) => item.projectSlug)));
    const nextPositionByProject = new Map<string, number>();
    if (uniqueProjectsToAdd.length > 0) {
      const projectPlaceholders = createPlaceholders(uniqueProjectsToAdd.length);
      const positionRows = await queryD1<ProjectPositionRow>(
        `
        SELECT
          project_slug AS projectSlug,
          COALESCE(MAX(position), 0) AS maxPosition
        FROM project_tracks
        WHERE project_slug IN (${projectPlaceholders})
        GROUP BY project_slug;
        `,
        uniqueProjectsToAdd
      );

      for (const projectSlug of uniqueProjectsToAdd) {
        const row = positionRows.find((item) => item.projectSlug === projectSlug);
        nextPositionByProject.set(projectSlug, toInt(row?.maxPosition ?? 0) + 1);
      }
    }

    for (const item of projectAdds) {
      const nextPosition = nextPositionByProject.get(item.projectSlug) ?? 1;
      await queryD1(
        `
        INSERT INTO project_tracks (project_slug, track_slug, position)
        VALUES (?, ?, ?)
        ON CONFLICT(project_slug, track_slug) DO NOTHING;
        `,
        [item.projectSlug, item.trackSlug, nextPosition]
      );
      nextPositionByProject.set(item.projectSlug, nextPosition + 1);
    }

    for (const item of tagDeletes) {
      await queryD1(`DELETE FROM track_tags WHERE track_slug = ? AND tag_slug = ?;`, [item.trackSlug, item.tagSlug]);
    }
    for (const item of tagAdds) {
      await queryD1(
        `
        INSERT INTO track_tags (track_slug, tag_slug)
        VALUES (?, ?)
        ON CONFLICT(track_slug, tag_slug) DO NOTHING;
        `,
        [item.trackSlug, item.tagSlug]
      );
    }

    return ok({
      updatedTrackSlugs: payload.trackSlugs
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
