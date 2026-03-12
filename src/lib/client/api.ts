interface CreatedEntityResponse {
  slug: string;
  name: string;
}

export interface ArtistUpdatePayload {
  slug: string;
  name?: string;
  description?: string;
}

export interface ProjectUpdatePayload {
  slug: string;
  name?: string;
  description?: string;
  type?: "album" | "ep" | "single" | "setlist";
  releaseDate?: string | null;
  remasterDate?: string | null;
  artistSlugs?: string[];
  trackSlugs?: string[];
}

export interface TrackUpdatePayload {
  slug: string;
  name?: string;
  artistSlugs?: string[];
  projectSlugs?: string[];
}

async function apiRequest<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string } }
      | null;
    throw new Error(payload?.error?.message ?? `Request failed: ${response.status}`);
  }

  return (await response.json()) as T;
}

export const api = {
  postArtist: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/artists`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  updateArtist: (artistSlug: string, payload: ArtistUpdatePayload) =>
    apiRequest(`/api/artists/${encodeURIComponent(artistSlug)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteArtist: (artistSlug: string) =>
    apiRequest<{ deleted: boolean }>(`/api/artists/${encodeURIComponent(artistSlug)}`, {
      method: "DELETE"
    }),

  postProject: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/projects`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  updateProject: (projectSlug: string, payload: ProjectUpdatePayload) =>
    apiRequest(`/api/projects/${encodeURIComponent(projectSlug)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteProject: (projectSlug: string) =>
    apiRequest<{ deleted: boolean }>(`/api/projects/${encodeURIComponent(projectSlug)}`, {
      method: "DELETE"
    }),

  createTrack: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/tracks`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  updateTrack: (trackSlug: string, payload: TrackUpdatePayload) =>
    apiRequest(`/api/tracks/${encodeURIComponent(trackSlug)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteTrack: (trackSlug: string) =>
    apiRequest<{ deleted: boolean }>(`/api/tracks/${encodeURIComponent(trackSlug)}`, {
      method: "DELETE"
    })
};
