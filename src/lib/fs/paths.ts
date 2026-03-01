import path from "node:path";

export const DATA_ROOT = process.env.SONGWRITER_DATA_ROOT ?? path.join(process.cwd(), "songwriting-data");

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

export function artistRoot(userSlug: string, artistSlug: string): string {
  return path.join(userRoot(userSlug), "artists", assertSafeSegment(artistSlug));
}

export function artistsRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "artists");
}

export function artistMarkdownPath(userSlug: string, artistSlug: string): string {
  return path.join(artistRoot(userSlug, artistSlug), "artist.md");
}

export function projectsRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "projects");
}

export function projectRoot(userSlug: string, projectSlug: string): string {
  return path.join(projectsRoot(userSlug), assertSafeSegment(projectSlug));
}

export function projectMarkdownPath(userSlug: string, projectSlug: string): string {
  return path.join(projectRoot(userSlug, projectSlug), "project.md");
}

export function tracksRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "tracks");
}

export function trackRoot(userSlug: string, trackSlug: string): string {
  return path.join(tracksRoot(userSlug), assertSafeSegment(trackSlug));
}

export function trackMarkdownPath(userSlug: string, trackSlug: string): string {
  return path.join(trackRoot(userSlug, trackSlug), "track.md");
}

export function fragmentsRoot(userSlug: string): string {
  return path.join(userRoot(userSlug), "fragments");
}

export function fragmentMarkdownPath(userSlug: string, fragmentSlug: string): string {
  return path.join(fragmentsRoot(userSlug), assertSafeSegment(fragmentSlug), "fragment.md");
}
