import {
  artistMarkdownPath,
  artistRoot,
  projectMarkdownPath,
  projectRoot,
  sandboxFragmentMarkdownPath,
  sandboxFragmentsRoot,
  sandboxTrackMarkdownPath,
  sandboxTracksRoot,
  trackMarkdownPath,
  trackRoot,
  userMarkdownPath,
  userRoot
} from "@/lib/fs/paths";
import path from "node:path";
import { readMarkdownFile, writeMarkdownFile } from "@/lib/fs/markdown";
import {
  artistSchema,
  fragmentSchema,
  projectSchema,
  trackSchema,
  userSchema
} from "@/lib/domain/schemas";
import { listDirectories, removeFileIfExists } from "@/lib/fs/walk";

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
  const artistSlugs = await listDirectories(path.join(userRoot(userSlug), "artists"));
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

export async function getProject(userSlug: string, artistSlug: string, projectSlug: string) {
  return readMarkdownFile(projectMarkdownPath(userSlug, artistSlug, projectSlug), projectSchema);
}

export async function listProjects(userSlug: string, artistSlug: string) {
  const projectSlugs = await listDirectories(path.join(artistRoot(userSlug, artistSlug), "projects"));
  return Promise.all(
    projectSlugs.map(async (projectSlug) => {
      const project = await getProject(userSlug, artistSlug, projectSlug);
      return { ...project, projectSlug };
    })
  );
}

export async function saveProject(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  data: unknown,
  content = ""
) {
  const validated = projectSchema.parse(data);
  await writeMarkdownFile(projectMarkdownPath(userSlug, artistSlug, projectSlug), validated, content);
}

export async function deleteProject(userSlug: string, artistSlug: string, projectSlug: string) {
  return removeFileIfExists(projectMarkdownPath(userSlug, artistSlug, projectSlug));
}

export async function getTrack(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
) {
  return readMarkdownFile(trackMarkdownPath(userSlug, artistSlug, projectSlug, trackSlug), trackSchema);
}

export async function listTracks(userSlug: string, artistSlug: string, projectSlug: string) {
  const trackSlugs = await listDirectories(
    path.join(projectRoot(userSlug, artistSlug, projectSlug), "tracks")
  );
  return Promise.all(
    trackSlugs.map(async (slug) => {
      const track = await getTrack(userSlug, artistSlug, projectSlug, slug);
      return { ...track, trackSlug: slug };
    })
  );
}

export async function saveTrack(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string,
  data: unknown,
  content = ""
) {
  const validated = trackSchema.parse(data);
  await writeMarkdownFile(
    trackMarkdownPath(userSlug, artistSlug, projectSlug, trackSlug),
    validated,
    content
  );
}

export async function deleteTrack(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
) {
  return removeFileIfExists(trackMarkdownPath(userSlug, artistSlug, projectSlug, trackSlug));
}

export async function getSandboxTrack(userSlug: string, trackSlug: string) {
  return readMarkdownFile(sandboxTrackMarkdownPath(userSlug, trackSlug), trackSchema);
}

export async function listSandboxTracks(userSlug: string) {
  const trackSlugs = await listDirectories(sandboxTracksRoot(userSlug));
  return Promise.all(
    trackSlugs.map(async (slug) => {
      const track = await getSandboxTrack(userSlug, slug);
      return { ...track, trackSlug: slug };
    })
  );
}

export async function saveSandboxTrack(
  userSlug: string,
  trackSlug: string,
  data: unknown,
  content = ""
) {
  const validated = trackSchema.parse(data);
  await writeMarkdownFile(sandboxTrackMarkdownPath(userSlug, trackSlug), validated, content);
}

export async function deleteSandboxTrack(userSlug: string, trackSlug: string) {
  return removeFileIfExists(sandboxTrackMarkdownPath(userSlug, trackSlug));
}

export async function getFragment(userSlug: string, fragmentSlug: string) {
  return readMarkdownFile(sandboxFragmentMarkdownPath(userSlug, fragmentSlug), fragmentSchema);
}

export async function listFragments(userSlug: string) {
  const fragmentSlugs = await listDirectories(sandboxFragmentsRoot(userSlug));
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
  await writeMarkdownFile(sandboxFragmentMarkdownPath(userSlug, fragmentSlug), validated, content);
}

export async function deleteFragment(userSlug: string, fragmentSlug: string) {
  return removeFileIfExists(sandboxFragmentMarkdownPath(userSlug, fragmentSlug));
}

export function getTrackMarkdownPath(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
) {
  return trackMarkdownPath(userSlug, artistSlug, projectSlug, trackSlug);
}

export function getSandboxTrackPath(userSlug: string, trackSlug: string) {
  return sandboxTrackMarkdownPath(userSlug, trackSlug);
}

export function getFragmentPath(userSlug: string, fragmentSlug: string) {
  return sandboxFragmentMarkdownPath(userSlug, fragmentSlug);
}
