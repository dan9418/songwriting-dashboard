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

export function userRoot(): string {
  return DATA_ROOT;
}

export function userMarkdownPath(): string {
  return path.join(userRoot(), "user.md");
}

export function artistRoot(artistSlug: string): string {
  return path.join(userRoot(), "artists", assertSafeSegment(artistSlug));
}

export function artistsRoot(): string {
  return path.join(userRoot(), "artists");
}

export function artistMarkdownPath(artistSlug: string): string {
  return path.join(artistRoot(artistSlug), "artist.md");
}

export function projectsRoot(): string {
  return path.join(userRoot(), "projects");
}

export function projectRoot(projectSlug: string): string {
  return path.join(projectsRoot(), assertSafeSegment(projectSlug));
}

export function projectMarkdownPath(projectSlug: string): string {
  return path.join(projectRoot(projectSlug), "project.md");
}

export function tracksRoot(): string {
  return path.join(userRoot(), "tracks");
}

export function trackRoot(trackSlug: string): string {
  return path.join(tracksRoot(), assertSafeSegment(trackSlug));
}

export function trackMarkdownPath(trackSlug: string): string {
  return path.join(trackRoot(trackSlug), "track.md");
}

export function fragmentsRoot(): string {
  return path.join(userRoot(), "fragments");
}

export function fragmentMarkdownPath(fragmentSlug: string): string {
  return path.join(fragmentsRoot(), assertSafeSegment(fragmentSlug), "fragment.md");
}
