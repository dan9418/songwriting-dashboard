import {
  artistMarkdownPath,
  projectMarkdownPath,
  sandboxFragmentMarkdownPath,
  sandboxTrackMarkdownPath,
  trackMarkdownPath,
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

export async function getUser(userSlug: string) {
  return readMarkdownFile(userMarkdownPath(userSlug), userSchema);
}

export async function saveUser(userSlug: string, data: unknown, content = "") {
  const validated = userSchema.parse(data);
  await writeMarkdownFile(userMarkdownPath(userSlug), validated, content);
}

export async function getArtist(userSlug: string, artistSlug: string) {
  return readMarkdownFile(artistMarkdownPath(userSlug, artistSlug), artistSchema);
}

export async function saveArtist(userSlug: string, artistSlug: string, data: unknown, content = "") {
  const validated = artistSchema.parse(data);
  await writeMarkdownFile(artistMarkdownPath(userSlug, artistSlug), validated, content);
}

export async function getProject(userSlug: string, artistSlug: string, projectSlug: string) {
  return readMarkdownFile(projectMarkdownPath(userSlug, artistSlug, projectSlug), projectSchema);
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

export async function getTrack(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
) {
  return readMarkdownFile(trackMarkdownPath(userSlug, artistSlug, projectSlug, trackSlug), trackSchema);
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

export async function getSandboxTrack(userSlug: string, trackSlug: string) {
  return readMarkdownFile(sandboxTrackMarkdownPath(userSlug, trackSlug), trackSchema);
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

export async function getFragment(userSlug: string, fragmentSlug: string) {
  return readMarkdownFile(sandboxFragmentMarkdownPath(userSlug, fragmentSlug), fragmentSchema);
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

