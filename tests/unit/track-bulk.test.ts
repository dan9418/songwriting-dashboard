import { describe, expect, it } from "vitest";
import {
  applyTrackBulkMetadataOperation,
  hasBulkMetadataChanges,
  normalizeSlugDelta
} from "@/lib/tracks/bulk";
import { trackBulkMetadataBodySchema } from "@/lib/domain/schemas";

describe("track bulk metadata helpers", () => {
  it("adds and removes metadata links without overwriting untouched values", () => {
    const next = applyTrackBulkMetadataOperation(
      {
        artistSlugs: ["dan", "mia"],
        projectSlugs: ["night-runs"],
        tagSlugs: ["keeper", "draft"]
      },
      {
        artists: { add: ["zara"], remove: ["mia"] },
        projects: { add: ["daybreak"], remove: [] },
        tags: { add: [], remove: ["draft"] }
      }
    );

    expect(next).toEqual({
      artistSlugs: ["dan", "zara"],
      projectSlugs: ["night-runs", "daybreak"],
      tagSlugs: ["keeper"]
    });
  });

  it("normalizes delta values and detects whether there is work to do", () => {
    const normalized = normalizeSlugDelta({
      add: ["dan", "dan", "mia"],
      remove: ["draft", "draft"]
    });

    expect(normalized).toEqual({
      add: ["dan", "mia"],
      remove: ["draft"]
    });
    expect(
      hasBulkMetadataChanges({
        trackSlugs: ["midnight-drive"],
        artists: normalized,
        projects: { add: [], remove: [] },
        tags: { add: [], remove: [] }
      })
    ).toBe(true);
  });

  it("rejects invalid bulk payloads with overlapping add/remove values", () => {
    const result = trackBulkMetadataBodySchema.safeParse({
      trackSlugs: ["midnight-drive"],
      artists: {
        add: ["dan"],
        remove: ["dan"]
      },
      projects: {
        add: [],
        remove: []
      },
      tags: {
        add: [],
        remove: []
      }
    });

    expect(result.success).toBe(false);
  });
});
