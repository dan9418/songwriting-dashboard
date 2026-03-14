import { queryD1 } from "@/lib/cloudflare/d1";
import { slugToTitle } from "@/lib/utils/slug-display";

interface ArtistRow {
  slug: string;
  name: string;
}

interface ProjectRow {
  slug: string;
  name: string;
  type: "album" | "ep" | "single" | "setlist";
}

interface ArtistProjectRow {
  artistSlug: string;
  projectSlug: string;
  projectName: string;
}

interface ArtistTrackRow {
  artistSlug: string;
  trackSlug: string;
}

interface ProjectArtistRow {
  projectSlug: string;
  artistSlug: string;
  artistName: string;
}

interface ProjectTrackRow {
  projectSlug: string;
  trackSlug: string;
}

export interface CloudflareArtistListItem {
  slug: string;
  name: string;
  projectSlugs: Array<{ slug: string; name: string }>;
  trackSlugs: string[];
}

export interface CloudflareProjectListItem {
  slug: string;
  name: string;
  type: "album" | "ep" | "single" | "setlist";
  artistSlugs: Array<{ slug: string; name: string }>;
  trackSlugs: string[];
}

export async function listArtistsFromCloudflare(): Promise<CloudflareArtistListItem[]> {
  const artistRows = await queryD1<ArtistRow>(
    `
    SELECT slug, name
    FROM artists
    ORDER BY name ASC, slug ASC;
    `
  );
  const artistProjectRows = await queryD1<ArtistProjectRow>(
    `
    SELECT
      pa.artist_slug AS artistSlug,
      pa.project_slug AS projectSlug,
      p.name AS projectName
    FROM project_artists pa
    INNER JOIN projects p
      ON p.slug = pa.project_slug;
    `
  );
  const artistTrackRows = await queryD1<ArtistTrackRow>(
    `
    SELECT
      ta.artist_slug AS artistSlug,
      ta.track_slug AS trackSlug
    FROM track_artists ta
    INNER JOIN tracks t
      ON t.slug = ta.track_slug
    ORDER BY ta.artist_slug ASC, t.name COLLATE NOCASE ASC, ta.track_slug ASC;
    `
  );

  const projectsByArtist = new Map<string, Array<{ slug: string; name: string }>>();
  for (const row of artistProjectRows) {
    const list = projectsByArtist.get(row.artistSlug) ?? [];
    list.push({ slug: row.projectSlug, name: row.projectName });
    projectsByArtist.set(row.artistSlug, list);
  }

  const tracksByArtist = new Map<string, string[]>();
  for (const row of artistTrackRows) {
    const list = tracksByArtist.get(row.artistSlug) ?? [];
    list.push(row.trackSlug);
    tracksByArtist.set(row.artistSlug, list);
  }

  return artistRows.map((artist) => ({
    slug: artist.slug,
    name: artist.name || slugToTitle(artist.slug),
    projectSlugs: projectsByArtist.get(artist.slug) ?? [],
    trackSlugs: tracksByArtist.get(artist.slug) ?? []
  }));
}

export async function listProjectsFromCloudflare(): Promise<CloudflareProjectListItem[]> {
  const projectRows = await queryD1<ProjectRow>(
    `
    SELECT slug, name, type
    FROM projects
    ORDER BY name ASC, slug ASC;
    `
  );
  const projectArtistRows = await queryD1<ProjectArtistRow>(
    `
    SELECT
      pa.project_slug AS projectSlug,
      pa.artist_slug AS artistSlug,
      a.name AS artistName
    FROM project_artists pa
    INNER JOIN artists a
      ON a.slug = pa.artist_slug;
    `
  );
  const projectTrackRows = await queryD1<ProjectTrackRow>(
    `
    SELECT
      project_slug AS projectSlug,
      track_slug AS trackSlug
    FROM project_tracks
    ORDER BY project_slug ASC, position ASC, track_slug ASC;
    `
  );

  const artistsByProject = new Map<string, Array<{ slug: string; name: string }>>();
  for (const row of projectArtistRows) {
    const list = artistsByProject.get(row.projectSlug) ?? [];
    list.push({ slug: row.artistSlug, name: row.artistName });
    artistsByProject.set(row.projectSlug, list);
  }

  const tracksByProject = new Map<string, string[]>();
  for (const row of projectTrackRows) {
    const list = tracksByProject.get(row.projectSlug) ?? [];
    list.push(row.trackSlug);
    tracksByProject.set(row.projectSlug, list);
  }

  return projectRows.map((project) => ({
    slug: project.slug,
    name: project.name || slugToTitle(project.slug),
    type: project.type,
    artistSlugs: artistsByProject.get(project.slug) ?? [],
    trackSlugs: tracksByProject.get(project.slug) ?? []
  }));
}
