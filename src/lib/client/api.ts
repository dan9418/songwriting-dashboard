import type {
  ArtistData,
  FragmentData,
  MarkdownEntity,
  ProjectData,
  SearchResult,
  TrackData,
  UserData
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
  getUser: (userSlug: string) => apiRequest<MarkdownEntity<UserData>>(`/api/user/${userSlug}`),
  patchUser: (userSlug: string, data: Partial<UserData>, content?: string) =>
    apiRequest<MarkdownEntity<UserData>>(`/api/user/${userSlug}`, {
      method: "PATCH",
      body: JSON.stringify({ data, content })
    }),

  listArtists: (userSlug: string) =>
    apiRequest<{ items: Array<MarkdownEntity<ArtistData> & { artistSlug: string }> }>(
      `/api/artists/${userSlug}`
    ),

  listProjects: (userSlug: string, artistSlug: string) =>
    apiRequest<{ items: Array<MarkdownEntity<ProjectData> & { projectSlug: string }> }>(
      `/api/projects/${userSlug}/${artistSlug}`
    ),

  listTracks: (
    userSlug: string,
    options?: { projectSlug?: string; artistSlug?: string; scope?: "archive" | "sandbox" }
  ) => {
    const url = new URL(`/api/tracks/${userSlug}`, window.location.origin);
    if (options?.projectSlug) {
      url.searchParams.set("projectSlug", options.projectSlug);
    }
    if (options?.artistSlug) {
      url.searchParams.set("artistSlug", options.artistSlug);
    }
    if (options?.scope === "sandbox") {
      url.searchParams.set("scope", "sandbox");
    }
    return apiRequest<{ items: Array<MarkdownEntity<TrackData> & { trackSlug: string }> }>(
      `${url.pathname}${url.search}`
    );
  },

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
    apiRequest<{ items: Array<MarkdownEntity<FragmentData> & { fragmentSlug: string }> }>(
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
    }),

  search: (userSlug: string, q: string, tags: string[], type?: SearchResult["type"] | "all") => {
    const url = new URL(`/api/search/${userSlug}`, window.location.origin);
    if (q.trim()) {
      url.searchParams.set("q", q.trim());
    }
    if (tags.length > 0) {
      url.searchParams.set("tags", tags.join(","));
    }
    if (type && type !== "all") {
      url.searchParams.set("type", type);
    }
    return apiRequest<{ items: SearchResult[] }>(`${url.pathname}${url.search}`);
  }
};
