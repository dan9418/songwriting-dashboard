interface CreatedEntityResponse {
  slug: string;
  name: string;
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

  postProject: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/projects`, {
      method: "POST",
      body: JSON.stringify({ name })
    }),

  createTrack: (name: string) =>
    apiRequest<CreatedEntityResponse>(`/api/tracks`, {
      method: "POST",
      body: JSON.stringify({ name })
    })
};
