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
import { listDirectories, removeFileIfExists } from "@/lib/fs/walk";

interface TrackListFilters {
  projectSlug?: string;
  artistSlug?: string;
  unassignedOnly?: boolean;
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
  await writeMarkdownFile(projectMarkdownPath(userSlug, projectSlug), validated, content);
}

export async function deleteProject(userSlug: string, projectSlug: string) {
  return removeFileIfExists(projectMarkdownPath(userSlug, projectSlug));
}

export async function getTrack(userSlug: string, trackSlug: string) {
  return readMarkdownFile(trackMarkdownPath(userSlug, trackSlug), trackSchema);
}

export async function listTracks(userSlug: string, filters: TrackListFilters = {}) {
  const trackSlugs = await listDirectories(tracksRoot(userSlug));
  const tracks = await Promise.all(
    trackSlugs.map(async (slug) => {
      const track = await getTrack(userSlug, slug);
      return { ...track, trackSlug: slug };
    })
  );

  return tracks.filter((track) => {
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
}

export async function saveTrack(
  userSlug: string,
  trackSlug: string,
  data: unknown,
  content = ""
) {
  const validated = trackSchema.parse(data);
  await writeMarkdownFile(trackMarkdownPath(userSlug, trackSlug), validated, content);
}

export async function deleteTrack(userSlug: string, trackSlug: string) {
  return removeFileIfExists(trackMarkdownPath(userSlug, trackSlug));
}

export async function getFragment(userSlug: string, fragmentSlug: string) {
  return readMarkdownFile(fragmentMarkdownPath(userSlug, fragmentSlug), fragmentSchema);
}

export async function listFragments(userSlug: string) {
  const fragmentSlugs = await listDirectories(fragmentsRoot(userSlug));
  return Promise.all(
    fragmentSlugs.map(async (slug) => {
      const fragment = await getFragment(userSlug, slug);
      return { ...fragment, fragmentSlug: slug };
    })
  );
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
