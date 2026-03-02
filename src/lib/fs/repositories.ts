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

export async function getUser(userSlug: string) {
  return readMarkdownFile(userMarkdownPath(userSlug), userSchema);
}

export async function saveUser(userSlug: string, data: unknown, content = "") {
  const validated = userSchema.parse(data);
  await writeMarkdownFile(userMarkdownPath(userSlug), validated, content);
}

export async function deleteUser(userSlug: string) {
  return removeFileIfExists(userMarkdownPath(userSlug));
}

export async function getArtist(userSlug: string, artistSlug: string) {
  return readMarkdownFile(artistMarkdownPath(userSlug, artistSlug), artistSchema);
}

export async function listArtists(userSlug: string) {
  const artistSlugs = await listDirectories(artistsRoot(userSlug));
  return Promise.all(
    artistSlugs.map(async (artistSlug) => {
      const artist = await getArtist(userSlug, artistSlug);
      return { ...artist, artistSlug };
    })
  );
}

export async function saveArtist(userSlug: string, artistSlug: string, data: unknown, content = "") {
  const validated = artistSchema.parse(data);
  await writeMarkdownFile(artistMarkdownPath(userSlug, artistSlug), validated, content);
}

export async function deleteArtist(userSlug: string, artistSlug: string) {
  return removeFileIfExists(artistMarkdownPath(userSlug, artistSlug));
}

export async function getProject(userSlug: string, projectSlug: string) {
  return readMarkdownFile(projectMarkdownPath(userSlug, projectSlug), projectSchema);
}

export async function listProjects(userSlug: string, artistSlug?: string) {
  const projectSlugs = await listDirectories(projectsRoot(userSlug));
  const projects = await Promise.all(
    projectSlugs.map(async (projectSlug) => {
      const project = await getProject(userSlug, projectSlug);
      return { ...project, projectSlug };
    })
  );

  if (!artistSlug) {
    return projects;
  }
  return projects.filter((project) => project.data.artistSlug === artistSlug);
}

export async function saveProject(
  userSlug: string,
  projectSlug: string,
  data: unknown,
  content = ""
) {
  const validated = projectSchema.parse(data);
  const existing = await getProjectIfExists(userSlug, projectSlug);
  const previousTrackSlugs =
    existing && existing.data.trackSlugs.length > 0
      ? existing.data.trackSlugs
      : existing
        ? (await listTracks(userSlug, { projectSlug })).map((item) => item.trackSlug)
        : [];

  await writeProjectFile(userSlug, projectSlug, validated, content);
  await syncTracksFromProject(userSlug, projectSlug, validated, previousTrackSlugs);
}

export async function deleteProject(userSlug: string, projectSlug: string) {
  const existing = await getProjectIfExists(userSlug, projectSlug);
  if (existing) {
    const trackedSlugs =
      existing.data.trackSlugs.length > 0
        ? existing.data.trackSlugs
        : (await listTracks(userSlug, { projectSlug })).map((item) => item.trackSlug);

    for (const trackSlug of trackedSlugs) {
      const track = await getTrackIfExists(userSlug, trackSlug);
      if (!track || track.data.projectSlug !== projectSlug) {
        continue;
      }
      await writeTrackFile(
        userSlug,
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
  return removeFileIfExists(projectMarkdownPath(userSlug, projectSlug));
}

export async function getTrack(userSlug: string, trackSlug: string) {
  return readMarkdownFile(trackMarkdownPath(userSlug, trackSlug), trackSchema);
}

export async function listTracks(userSlug: string, filters: TrackListFilters = {}) {
  const result = await listTracksWithSummary(userSlug, filters);
  return result.items;
}

export async function listTracksWithSummary(userSlug: string, filters: TrackListFilters = {}) {
  const trackSlugs = await listDirectories(tracksRoot(userSlug));
  const items = await Promise.all(
    trackSlugs.map(async (slug) => {
      const markdownPath = trackMarkdownPath(userSlug, slug);
      if (!(await pathExists(markdownPath))) {
        return null;
      }
      try {
        const track = await getTrack(userSlug, slug);
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
  userSlug: string,
  trackSlug: string,
  data: unknown,
  content = ""
) {
  const existing = await getTrackIfExists(userSlug, trackSlug);
  const validated = trackSchema.parse(data);
  const normalized = await normalizeTrackAgainstProject(userSlug, validated);

  await writeTrackFile(userSlug, trackSlug, normalized, content);
  await syncProjectMembershipForTrack(
    userSlug,
    trackSlug,
    existing?.data.projectSlug,
    normalized.projectSlug
  );
}

export async function deleteTrack(userSlug: string, trackSlug: string) {
  const existing = await getTrackIfExists(userSlug, trackSlug);
  if (existing?.data.projectSlug) {
    const project = await getProjectIfExists(userSlug, existing.data.projectSlug);
    if (project && project.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        userSlug,
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
  return removeFileIfExists(trackMarkdownPath(userSlug, trackSlug));
}

export async function getFragment(userSlug: string, fragmentSlug: string) {
  return readMarkdownFile(fragmentMarkdownPath(userSlug, fragmentSlug), fragmentSchema);
}

export async function listFragments(userSlug: string) {
  const result = await listFragmentsWithSummary(userSlug);
  return result.items;
}

export async function listFragmentsWithSummary(userSlug: string) {
  const fragmentSlugs = await listDirectories(fragmentsRoot(userSlug));
  const items = await Promise.all(
    fragmentSlugs.map(async (slug) => {
      const markdownPath = fragmentMarkdownPath(userSlug, slug);
      if (!(await pathExists(markdownPath))) {
        return null;
      }
      try {
        const fragment = await getFragment(userSlug, slug);
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
  userSlug: string,
  fragmentSlug: string,
  data: unknown,
  content = ""
) {
  const validated = fragmentSchema.parse(data);
  await writeMarkdownFile(fragmentMarkdownPath(userSlug, fragmentSlug), validated, content);
}

export async function deleteFragment(userSlug: string, fragmentSlug: string) {
  return removeFileIfExists(fragmentMarkdownPath(userSlug, fragmentSlug));
}

export function getTrackMarkdownPath(userSlug: string, trackSlug: string) {
  return trackMarkdownPath(userSlug, trackSlug);
}

export function getFragmentPath(userSlug: string, fragmentSlug: string) {
  return fragmentMarkdownPath(userSlug, fragmentSlug);
}

async function getProjectIfExists(userSlug: string, projectSlug: string) {
  try {
    return await getProject(userSlug, projectSlug);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function getTrackIfExists(userSlug: string, trackSlug: string) {
  try {
    return await getTrack(userSlug, trackSlug);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return null;
    }
    throw error;
  }
}

async function writeProjectFile(
  userSlug: string,
  projectSlug: string,
  data: ProjectFrontmatter,
  content: string
) {
  await writeMarkdownFile(projectMarkdownPath(userSlug, projectSlug), projectSchema.parse(data), content);
}

async function writeTrackFile(
  userSlug: string,
  trackSlug: string,
  data: TrackFrontmatter,
  content: string
) {
  await writeMarkdownFile(trackMarkdownPath(userSlug, trackSlug), trackSchema.parse(data), content);
}

async function normalizeTrackAgainstProject(
  userSlug: string,
  track: TrackFrontmatter
): Promise<TrackFrontmatter> {
  if (!track.projectSlug) {
    return track;
  }
  const project = await getProjectIfExists(userSlug, track.projectSlug);
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
  userSlug: string,
  trackSlug: string,
  previousProjectSlug: string | undefined,
  nextProjectSlug: string | undefined
) {
  if (previousProjectSlug && previousProjectSlug !== nextProjectSlug) {
    const previousProject = await getProjectIfExists(userSlug, previousProjectSlug);
    if (previousProject && previousProject.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        userSlug,
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
    const nextProject = await getProjectIfExists(userSlug, nextProjectSlug);
    if (!nextProject) {
      return;
    }
    if (!nextProject.data.trackSlugs.includes(trackSlug)) {
      await writeProjectFile(
        userSlug,
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
  userSlug: string,
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
    const track = await getTrackIfExists(userSlug, trackSlug);
    if (!track || track.data.projectSlug !== projectSlug) {
      continue;
    }
    await writeTrackFile(
      userSlug,
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
    const track = await getTrackIfExists(userSlug, trackSlug);
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
      userSlug,
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
