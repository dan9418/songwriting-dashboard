import path from "node:path";

export const DATA_ROOT = process.env.SONGWRITER_DATA_ROOT ?? path.join(process.cwd(), "songwriter-data");

function assertSafeSegment(segment: string): string {
  const normalized = segment.trim();
  if (!normalized) {
    throw new Error("Path segment cannot be empty.");
  }
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(normalized)) {
    throw new Error(`Unsafe path segment: ${segment}`);
  }
  return normalized;
}

export function userRoot(userSlug: string): string {
  return path.join(DATA_ROOT, "users", assertSafeSegment(userSlug));
}

export function userMarkdownPath(userSlug: string): string {
  return path.join(userRoot(userSlug), "user.md");
}

export function sandboxTracksRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "sandbox", "tracks");
}

export function sandboxFragmentsRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "sandbox", "fragments");
}

export function artistRoot(userSlug: string, artistSlug: string): string {
  return path.join(userRoot(userSlug), "artists", assertSafeSegment(artistSlug));
}

export function artistMarkdownPath(userSlug: string, artistSlug: string): string {
  return path.join(artistRoot(userSlug, artistSlug), "artist.md");
}

export function projectRoot(userSlug: string, artistSlug: string, projectSlug: string): string {
  return path.join(artistRoot(userSlug, artistSlug), "projects", assertSafeSegment(projectSlug));
}

export function projectMarkdownPath(userSlug: string, artistSlug: string, projectSlug: string): string {
  return path.join(projectRoot(userSlug, artistSlug, projectSlug), "project.md");
}

export function trackRoot(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
): string {
  return path.join(
    projectRoot(userSlug, artistSlug, projectSlug),
    "tracks",
    assertSafeSegment(trackSlug)
  );
}

export function trackMarkdownPath(
  userSlug: string,
  artistSlug: string,
  projectSlug: string,
  trackSlug: string
): string {
  return path.join(trackRoot(userSlug, artistSlug, projectSlug, trackSlug), "track.md");
}

export function sandboxTrackMarkdownPath(userSlug: string, trackSlug: string): string {
  return path.join(sandboxTracksRoot(userSlug), assertSafeSegment(trackSlug), "track.md");
}

export function sandboxFragmentMarkdownPath(userSlug: string, fragmentSlug: string): string {
  return path.join(sandboxFragmentsRoot(userSlug), assertSafeSegment(fragmentSlug), "fragment.md");
}

