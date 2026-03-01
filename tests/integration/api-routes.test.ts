import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

interface RouteContext<T> {
  params: Promise<T>;
}

function jsonRequest(method: string, payload?: unknown): Request {
  return new Request("http://localhost/api", {
    method,
    headers: { "content-type": "application/json" },
    body: payload ? JSON.stringify(payload) : undefined
  });
}

describe("API integration", () => {
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "songwriting-data-"));
    process.env.SONGWRITER_DATA_ROOT = tempRoot;
    vi.resetModules();
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
    delete process.env.SONGWRITER_DATA_ROOT;
    vi.resetModules();
  });

  it("validates track audio naming and auto-renames on title updates", async () => {
    const trackListRoute = await import(
      "@/app/api/tracks/[userSlug]/[artistSlug]/[projectSlug]/route"
    );
    const trackItemRoute = await import(
      "@/app/api/tracks/[userSlug]/[artistSlug]/[projectSlug]/[trackSlug]/route"
    );
    const repositories = await import("@/lib/fs/repositories");

    const params: RouteContext<{ userSlug: string; artistSlug: string; projectSlug: string }> = {
      params: Promise.resolve({ userSlug: "dan", artistSlug: "neon-park", projectSlug: "city-lights" })
    };

    const invalidCreate = await trackListRoute.POST(
      jsonRequest("POST", {
        data: {
          slug: "midnight-drive",
          title: "Midnight Drive",
          tags: [],
          createdAt: "2026-03-01T10:00:00-05:00",
          updatedAt: "2026-03-01T10:00:00-05:00",
          userSlug: "dan",
          artistSlugs: ["neon-park"],
          projectSlug: "city-lights",
          status: "in-progress",
          audioVersions: [
            {
              fileName: "Midnight Drive - demo 2 (02-14-25).mp3",
              slug: "ignored",
              category: "demo",
              versionNumber: 3,
              recordedDate: "02-14-25"
            }
          ]
        }
      }),
      params
    );

    expect(invalidCreate.status).toBe(400);

    const validCreate = await trackListRoute.POST(
      jsonRequest("POST", {
        data: {
          slug: "midnight-drive",
          title: "Midnight Drive",
          tags: [],
          createdAt: "2026-03-01T10:00:00-05:00",
          updatedAt: "2026-03-01T10:00:00-05:00",
          userSlug: "dan",
          artistSlugs: ["neon-park"],
          projectSlug: "city-lights",
          status: "in-progress",
          audioVersions: [
            {
              fileName: "Midnight Drive - demo 2 (02-14-25).mp3",
              slug: "ignored",
              category: "demo",
              versionNumber: 2,
              recordedDate: "02-14-25"
            }
          ]
        }
      }),
      params
    );

    expect(validCreate.status).toBe(201);

    const itemParams: RouteContext<{
      userSlug: string;
      artistSlug: string;
      projectSlug: string;
      trackSlug: string;
    }> = {
      params: Promise.resolve({
        userSlug: "dan",
        artistSlug: "neon-park",
        projectSlug: "city-lights",
        trackSlug: "midnight-drive"
      })
    };

    const patchResponse = await trackItemRoute.PATCH(
      jsonRequest("PATCH", { data: { title: "Midnight Drive Revised" } }),
      itemParams
    );
    expect(patchResponse.status).toBe(200);

    const saved = await repositories.getTrack("dan", "neon-park", "city-lights", "midnight-drive");
    expect(saved.data.audioVersions[0]?.fileName).toBe(
      "Midnight Drive Revised - demo 2 (02-14-25).mp3"
    );
  });

  it("lists fragments and finds them via search endpoint", async () => {
    const fragmentListRoute = await import("@/app/api/sandbox/fragments/[userSlug]/route");
    const searchRoute = await import("@/app/api/search/[userSlug]/route");

    const fragmentParams: RouteContext<{ userSlug: string }> = {
      params: Promise.resolve({ userSlug: "dan" })
    };

    await fragmentListRoute.POST(
      jsonRequest("POST", {
        data: {
          slug: "frag-a",
          title: "Neon Rain",
          tags: ["night"],
          createdAt: "2026-03-01T10:00:00-05:00",
          updatedAt: "2026-03-01T10:00:00-05:00",
          userSlug: "dan",
          text: "Neon rain on the dashboard lights",
          relatedTrackSlugs: []
        }
      }),
      fragmentParams
    );

    await fragmentListRoute.POST(
      jsonRequest("POST", {
        data: {
          slug: "frag-b",
          title: "Morning Static",
          tags: ["day"],
          createdAt: "2026-03-01T10:00:00-05:00",
          updatedAt: "2026-03-01T10:00:00-05:00",
          userSlug: "dan",
          text: "Coffee steam and static noise",
          relatedTrackSlugs: []
        }
      }),
      fragmentParams
    );

    const listResponse = await fragmentListRoute.GET(new Request("http://localhost"), fragmentParams);
    expect(listResponse.status).toBe(200);
    const listed = (await listResponse.json()) as { items: Array<{ data: { slug: string } }> };
    expect(listed.items).toHaveLength(2);

    const searchResponse = await searchRoute.GET(
      new Request("http://localhost/api/search/dan?q=dashboard&type=fragment"),
      { params: Promise.resolve({ userSlug: "dan" }) }
    );

    expect(searchResponse.status).toBe(200);
    const searchPayload = (await searchResponse.json()) as { items: Array<{ slug: string }> };
    expect(searchPayload.items.map((item) => item.slug)).toContain("frag-a");
  });
});

