interface CreatedEntityResponse {
  slug: string;
  name: string;
}

import type { NotebookPageListItem, NotebookPageRecord } from "@/lib/domain/models";

export interface ArtistCreatePayload {
  name: string;
  description?: string;
  projectSlugs?: string[];
  trackSlugs?: string[];
}

export interface ArtistUpdatePayload {
  slug: string;
  name?: string;
  description?: string;
  projectSlugs?: string[];
  trackSlugs?: string[];
}

export interface ProjectCreatePayload {
  name: string;
  description?: string;
  type?: "album" | "ep" | "single" | "setlist";
  releaseDate?: string | null;
  remasterDate?: string | null;
  artistSlugs?: string[];
  trackSlugs?: string[];
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
  trackNameUpdates?: Array<{
    slug: string;
    name: string;
  }>;
}

export interface TrackCreatePayload {
  name: string;
  artistSlugs?: string[];
  projectSlugs?: string[];
}

export interface TrackUpdatePayload {
  slug: string;
  name?: string;
  artistSlugs?: string[];
  projectSlugs?: string[];
}

export interface NotebookPageCreatePayload {
  name: string;
  description?: string;
  pageType: string;
  content?: string;
}

export interface NotebookPageUpdatePayload {
  content: string;
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
  postArtist: (payload: ArtistCreatePayload) =>
    apiRequest<CreatedEntityResponse>(`/api/artists`, {
      method: "POST",
      body: JSON.stringify(payload)
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

  postProject: (payload: ProjectCreatePayload) =>
    apiRequest<CreatedEntityResponse>(`/api/projects`, {
      method: "POST",
      body: JSON.stringify(payload)
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

  createTrack: (payload: TrackCreatePayload) =>
    apiRequest<CreatedEntityResponse>(`/api/tracks`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  updateTrack: (trackSlug: string, payload: TrackUpdatePayload) =>
    apiRequest(`/api/tracks/${encodeURIComponent(trackSlug)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteTrack: (trackSlug: string) =>
    apiRequest<{ deleted: boolean }>(`/api/tracks/${encodeURIComponent(trackSlug)}`, {
      method: "DELETE"
    }),

  listNotebookPages: () => apiRequest<NotebookPageListItem[]>(`/api/notebook/pages`),

  getNotebookPage: (pageSlug: string) =>
    apiRequest<NotebookPageRecord>(`/api/notebook/pages/${encodeURIComponent(pageSlug)}`),

  createNotebookPage: (payload: NotebookPageCreatePayload) =>
    apiRequest<NotebookPageRecord>(`/api/notebook/pages`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  updateNotebookPage: (pageSlug: string, payload: NotebookPageUpdatePayload) =>
    apiRequest<NotebookPageRecord>(`/api/notebook/pages/${encodeURIComponent(pageSlug)}`, {
      method: "PUT",
      body: JSON.stringify(payload)
    }),

  deleteNotebookPage: (pageSlug: string) =>
    apiRequest<{ deleted: boolean }>(`/api/notebook/pages/${encodeURIComponent(pageSlug)}`, {
      method: "DELETE"
    })
};
