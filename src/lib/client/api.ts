import type {
  ArtistData,
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
  listArtists: (userSlug: string) =>
    apiRequest<{ items: Array<MarkdownEntity<ArtistData> & { artistSlug: string }> }>(
      `/api/artists/${userSlug}`
    ),
  getArtist: (userSlug: string, artistSlug: string) =>
    apiRequest<MarkdownEntity<ArtistData>>(`/api/artists/${userSlug}/${artistSlug}`),
  putArtist: (userSlug: string, artistSlug: string, data: ArtistData, content: string) =>
    apiRequest<MarkdownEntity<ArtistData>>(`/api/artists/${userSlug}/${artistSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),

  listProjects: (userSlug: string, artistSlug: string) =>
    apiRequest<{ items: Array<MarkdownEntity<ProjectData> & { projectSlug: string }> }>(
      `/api/projects/${userSlug}/${artistSlug}`
    ),
  getProject: (userSlug: string, artistSlug: string, projectSlug: string) =>
    apiRequest<MarkdownEntity<ProjectData>>(`/api/projects/${userSlug}/${artistSlug}/${projectSlug}`),
  putProject: (
    userSlug: string,
    artistSlug: string,
    projectSlug: string,
    data: ProjectData,
    content: string
  ) =>
    apiRequest<MarkdownEntity<ProjectData>>(`/api/projects/${userSlug}/${artistSlug}/${projectSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),

  listTracks: (userSlug: string) => apiRequest<{ items: TrackListItem[] }>(`/api/tracks/${userSlug}`),

  getTrack: (userSlug: string, trackSlug: string) =>
    apiRequest<MarkdownEntity<TrackData>>(`/api/tracks/${userSlug}/${trackSlug}`),

  putTrack: (
    userSlug: string,
    trackSlug: string,
    data: TrackData,
    content: string
  ) =>
    apiRequest<MarkdownEntity<TrackData>>(`/api/tracks/${userSlug}/${trackSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    }),

  postTrack: (userSlug: string, data: TrackData, content: string) =>
    apiRequest<MarkdownEntity<TrackData>>(`/api/tracks/${userSlug}`, {
      method: "POST",
      body: JSON.stringify({ data, content })
    }),

  listFragments: (userSlug: string) =>
    apiRequest<{
      items: Array<MarkdownEntity<FragmentData> & { fragmentSlug: string }>;
      summary: FragmentImportSummary;
    }>(
      `/api/fragments/${userSlug}`
    ),

  getFragment: (userSlug: string, fragmentSlug: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments/${userSlug}/${fragmentSlug}`),

  postFragment: (userSlug: string, data: FragmentData, content: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments/${userSlug}`, {
      method: "POST",
      body: JSON.stringify({ data, content })
    }),

  putFragment: (userSlug: string, fragmentSlug: string, data: FragmentData, content: string) =>
    apiRequest<MarkdownEntity<FragmentData>>(`/api/fragments/${userSlug}/${fragmentSlug}`, {
      method: "PUT",
      body: JSON.stringify({ data, content })
    })
};
