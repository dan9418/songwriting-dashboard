import type {
  ArtistData,
  CreatedEntityResponse,
  FragmentData,
  MarkdownEntity,
  ProjectData,
  TrackListItem,
  TrackData,
  FragmentImportSummary
} from "@/lib/client/types";

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
  listArtists: () =>
    apiRequest<{ items: Array<MarkdownEntity<ArtistData> & { artistSlug: string }> }>(
      `/api/artists`
    ),
  getArtist: (artistSlug: string) =>
    apiRequest<MarkdownEntity<ArtistData>>(`/api/artists/${artistSlug}`),
  putArtist: (artistSlug: string, data: ArtistData, content: string) =>
    apiRequest<MarkdownEntity<ArtistData>>(`/api/artists/${artistSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),
  postArtist: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/artists`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  listProjects: (artistSlug: string) =>
    apiRequest<{ items: Array<MarkdownEntity<ProjectData> & { projectSlug: string }> }>(
      `/api/projects/${artistSlug}`
    ),
  getProject: (artistSlug: string, projectSlug: string) =>
    apiRequest<MarkdownEntity<ProjectData>>(`/api/projects/${artistSlug}/${projectSlug}`),
  putProject: (artistSlug: string, projectSlug: string, data: ProjectData, content: string) =>
    apiRequest<MarkdownEntity<ProjectData>>(`/api/projects/${artistSlug}/${projectSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),
  postProject: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/projects`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  listTracks: () => apiRequest<{ items: TrackListItem[] }>(`/api/tracks`),

  getTrack: (trackSlug: string) => apiRequest<MarkdownEntity<TrackData>>(`/api/tracks/${trackSlug}`),

  putTrack: (trackSlug: string, data: TrackData, content: string) =>
    apiRequest<MarkdownEntity<TrackData>>(`/api/tracks/${trackSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),

  postTrack: (data: TrackData, content: string) =>
    apiRequest<MarkdownEntity<TrackData>>(`/api/tracks`, {
      method: "POST",
      body: JSON.stringify({ data, content })
    }),
  createTrack: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/tracks`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  listFragments: () =>
    apiRequest<{
      items: Array<MarkdownEntity<FragmentData> & { fragmentSlug: string }>;
      summary: FragmentImportSummary;
    }>(`/api/fragments`),

  getFragment: (fragmentSlug: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments/${fragmentSlug}`),

  postFragment: (data: FragmentData, content: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments`, {
      method: "POST",
      body: JSON.stringify({ data, content })
    }),

  putFragment: (fragmentSlug: string, data: FragmentData, content: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments/${fragmentSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    })
};
