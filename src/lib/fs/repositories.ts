import {
  artistMarkdownPath,
  artistsRoot,
  fragmentMarkdownPath,
  fragmentsRoot,
  projectMarkdownPath,
  projectsRoot,
  trackMarkdownPath,
  tracksRoot,
  userMarkdownPath
} from "@/lib/fs/paths";
import { readMarkdownFile, writeMarkdownFile } from "@/lib/fs/markdown";
import {
  artistSchema,
  fragmentSchema,
  projectSchema,
  trackSchema,
  userSchema
} from "@/lib/domain/schemas";
import { listDirectories, pathExists, removeFileIfExists } from "@/lib/fs/walk";
import type { ProjectFrontmatter, TrackFrontmatter } from "@/lib/domain/schemas";

interface TrackListFilters {
  projectSlug?: string;
  artistSlug?: string;
  unassignedOnly?: boolean;
}

export interface TrackImportSummary {
  loaded: number;
  matched: number;
  total: number;
  failed: number;
}

export interface FragmentImportSummary {
  loaded: number;
  total: number;
  failed: number;
}

export async function getUser() {
  return readMarkdownFile(userMarkdownPath(), userSchema);
}

export async function saveUser(data: unknown, content = "") {
  const validated = userSchema.parse(data);
  await writeMarkdownFile(userMarkdownPath(), validated, content);
}

export async function deleteUser() {
  return removeFileIfExists(userMarkdownPath());
}

export async function getArtist(artistSlug: string) {
  return readMarkdownFile(artistMarkdownPath(artistSlug), artistSchema);
}

export async function listArtists() {
  const artistSlugs = await listDirectories(artistsRoot());
  return Promise.all(
    artistSlugs.map(async (artistSlug) => {
      const artist = await getArtist(artistSlug);
      return { ...artist, artistSlug };
    })
  );
}

export async function saveArtist(artistSlug: string, data: unknown, content = "") {
  const validated = artistSchema.parse(data);
  await writeMarkdownFile(artistMarkdownPath(artistSlug), validated, content);
}

export async function deleteArtist(artistSlug: string) {
  return removeFileIfExists(artistMarkdownPath(artistSlug));
}

export async function getProject(projectSlug: string) {
  return readMarkdownFile(projectMarkdownPath(projectSlug), projectSchema);
}

export async function listProjects(artistSlug?: string) {
  const projectSlugs = await listDirectories(projectsRoot());
  const projects = await Promise.all(
    projectSlugs.map(async (projectSlug) => {
      const project = await getProject(projectSlug);
      return { ...project, projectSlug };
    })
  );

  if (!artistSlug) {
    return projects;
  }
  return projects.filter((project) => project.data.artistSlug === artistSlug);
}

export async function saveProject(projectSlug: string, data: unknown, content = "") {
  const validated = projectSchema.parse(data);
  const existing = await getProjectIfExists(projectSlug);
  const previousTrackSlugs =
    existing && existing.data.trackSlugs.length > 0
      ? existing.data.trackSlugs
      : existing
        ? (await listTracks({ projectSlug })).map((item) => item.trackSlug)
        : [];

  await writeProjectFile(projectSlug, validated, content);
  await syncTracksFromProject(projectSlug, validated, previousTrackSlugs);
}

export async function deleteProject(projectSlug: string) {
  const existing = await getProjectIfExists(projectSlug);
  if (existing) {
    const trackedSlugs =
      existing.data.trackSlugs.length > 0
        ? existing.data.trackSlugs
        : (await listTracks({ projectSlug })).map((item) => item.trackSlug);

    for (const trackSlug of trackedSlugs) {
      const track = await getTrackIfExists(trackSlug);
      if (!track || track.data.projectSlug !== projectSlug) {
        continue;
      }
      await writeTrackFile(
        trackSlug,
        {
          ...track.data,
          projectSlug: undefined,
          updatedAt: new Date().toISOString()
        },
        track.content
      );
    }
  }
  return removeFileIfExists(projectMarkdownPath(projectSlug));
}

export async function getTrack(trackSlug: string) {
  return readMarkdownFile(trackMarkdownPath(trackSlug), trackSchema);
}

export async function listTracks(filters: TrackListFilters = {}) {
  const result = await listTracksWithSummary(filters);
  return result.items;
}

export async function listTracksWithSummary(filters: TrackListFilters = {}) {
  const trackSlugs = await listDirectories(tracksRoot());
  const items = await Promise.all(
    trackSlugs.map(async (slug) => {
      const markdownPath = trackMarkdownPath(slug);
      if (!(await pathExists(markdownPath))) {
        return null;
      }
      try {
        const track = await getTrack(slug);
        return { ...track, trackSlug: slug };
      } catch {
        return null;
      }
    })
  );

  const filtered = items.filter((track): track is NonNullable<typeof track> => {
    if (!track) {
      return false;
    }
    if (filters.projectSlug && track.data.projectSlug !== filters.projectSlug) {
      return false;
    }
    if (filters.unassignedOnly && track.data.projectSlug) {
      return false;
    }
    if (filters.artistSlug && !track.data.artistSlugs.includes(filters.artistSlug)) {
      return false;
    }
    return true;
  });

  return {
    items: filtered,
    summary: {
      loaded: items.filter(Boolean).length,
      matched: filtered.length,
      total: trackSlugs.length,
      failed: trackSlugs.length - items.filter(Boolean).length
    } satisfies TrackImportSummary
  };
}

export async function saveTrack(
  trackSlug: string,
  data: unknown,
  content = ""
) {
  const existing = await getTrackIfExists(trackSlug);
  const validated = trackSchema.parse(data);
  const normalized = await normalizeTrackAgainstProject(validated);

  await writeTrackFile(trackSlug, normalized, content);
  await syncProjectMembershipForTrack(
    trackSlug,
    existing?.data.projectSlug,
    normalized.projectSlug
  );
}

export async function deleteTrack(trackSlug: string) {
  const existing = await getTrackIfExists(trackSlug);
  if (existing?.data.projectSlug) {
    const project = await getProjectIfExists(existing.data.projectSlug);
    if (project && project.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        existing.data.projectSlug,
        {
          ...project.data,
          trackSlugs: project.data.trackSlugs.filter((slug) => slug !== trackSlug),
          updatedAt: new Date().toISOString()
        },
        project.content
      );
    }
  }
  return removeFileIfExists(trackMarkdownPath(trackSlug));
}

export async function getFragment(fragmentSlug: string) {
  return readMarkdownFile(fragmentMarkdownPath(fragmentSlug), fragmentSchema);
}

export async function listFragments() {
  const result = await listFragmentsWithSummary();
  return result.items;
}

export async function listFragmentsWithSummary() {
  const fragmentSlugs = await listDirectories(fragmentsRoot());
  const items = await Promise.all(
    fragmentSlugs.map(async (slug) => {
      const markdownPath = fragmentMarkdownPath(slug);
      if (!(await pathExists(markdownPath))) {
        return null;
      }
      try {
        const fragment = await getFragment(slug);
        return { ...fragment, fragmentSlug: slug };
      } catch {
        return null;
      }
    })
  );

  return {
    items: items.filter((item): item is NonNullable<typeof item> => item !== null),
    summary: {
      loaded: items.filter(Boolean).length,
      total: fragmentSlugs.length,
      failed: fragmentSlugs.length - items.filter(Boolean).length
    } satisfies FragmentImportSummary
  };
}

export async function saveFragment(
  fragmentSlug: string,
  data: unknown,
  content = ""
) {
  const validated = fragmentSchema.parse(data);
  await writeMarkdownFile(fragmentMarkdownPath(fragmentSlug), validated, content);
}

export async function deleteFragment(fragmentSlug: string) {
  return removeFileIfExists(fragmentMarkdownPath(fragmentSlug));
}

export function getTrackMarkdownPath(trackSlug: string) {
  return trackMarkdownPath(trackSlug);
}

export function getFragmentPath(fragmentSlug: string) {
  return fragmentMarkdownPath(fragmentSlug);
}

async function getProjectIfExists(projectSlug: string) {
  try {
    return await getProject(projectSlug);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function getTrackIfExists(trackSlug: string) {
  try {
    return await getTrack(trackSlug);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeProjectFile(projectSlug: string, data: ProjectFrontmatter, content: string) {
  await writeMarkdownFile(projectMarkdownPath(projectSlug), projectSchema.parse(data), content);
}

async function writeTrackFile(trackSlug: string, data: TrackFrontmatter, content: string) {
  await writeMarkdownFile(trackMarkdownPath(trackSlug), trackSchema.parse(data), content);
}

async function normalizeTrackAgainstProject(track: TrackFrontmatter): Promise<TrackFrontmatter> {
  if (!track.projectSlug) {
    return track;
  }
  const project = await getProjectIfExists(track.projectSlug);
  if (!project) {
    return track;
  }
  const artistSlugs = track.artistSlugs.includes(project.data.artistSlug)
    ? track.artistSlugs
    : [...track.artistSlugs, project.data.artistSlug];
  return {
    ...track,
    artistSlugs
  };
}

async function syncProjectMembershipForTrack(
  trackSlug: string,
  previousProjectSlug: string | undefined,
  nextProjectSlug: string | undefined
) {
  if (previousProjectSlug && previousProjectSlug !== nextProjectSlug) {
    const previousProject = await getProjectIfExists(previousProjectSlug);
    if (previousProject && previousProject.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        previousProjectSlug,
        {
          ...previousProject.data,
          trackSlugs: previousProject.data.trackSlugs.filter((slug) => slug !== trackSlug),
          updatedAt: new Date().toISOString()
        },
        previousProject.content
      );
    }
  }

  if (nextProjectSlug) {
    const nextProject = await getProjectIfExists(nextProjectSlug);
    if (!nextProject) {
      return;
    }
    if (!nextProject.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        nextProjectSlug,
        {
          ...nextProject.data,
          trackSlugs: [...nextProject.data.trackSlugs, trackSlug],
          updatedAt: new Date().toISOString()
        },
        nextProject.content
      );
    }
  }
}

async function syncTracksFromProject(
  projectSlug: string,
  nextProject: ProjectFrontmatter,
  previousTrackSlugs: string[]
) {
  const previousSet = new Set(previousTrackSlugs);
  const nextSet = new Set(nextProject.trackSlugs);

  for (const trackSlug of previousSet) {
    if (nextSet.has(trackSlug)) {
      continue;
    }
    const track = await getTrackIfExists(trackSlug);
    if (!track || track.data.projectSlug !== projectSlug) {
      continue;
    }
    await writeTrackFile(
      trackSlug,
      {
        ...track.data,
        projectSlug: undefined,
        updatedAt: new Date().toISOString()
      },
      track.content
    );
  }

  for (const trackSlug of nextProject.trackSlugs) {
    const track = await getTrackIfExists(trackSlug);
    if (!track) {
      continue;
    }
    const artistSlugs = track.data.artistSlugs.includes(nextProject.artistSlug)
      ? track.data.artistSlugs
      : [...track.data.artistSlugs, nextProject.artistSlug];

    const needsUpdate =
      track.data.projectSlug !== projectSlug ||
      artistSlugs.length !== track.data.artistSlugs.length;

    if (!needsUpdate) {
      continue;
    }

    await writeTrackFile(
      trackSlug,
      {
        ...track.data,
        projectSlug,
        artistSlugs,
        updatedAt: new Date().toISOString()
      },
      track.content
    );
  }
}
