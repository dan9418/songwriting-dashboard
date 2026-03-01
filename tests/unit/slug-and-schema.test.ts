import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slug";
import { trackSchema } from "@/lib/domain/schemas";

describe("slug and schema validation", () => {
  it("slugifies mixed-case text safely", () => {
    expect(slugify(" Midnight Drive!! 2026 ")).toBe("midnight-drive-2026");
  });

  it("rejects invalid track schema payloads", () => {
    const result = trackSchema.safeParse({
      slug: "Invalid Slug",
      title: "Test",
      tags: [],
      createdAt: "2026-03-01T10:00:00-05:00",
      updatedAt: "2026-03-01T10:00:00-05:00",
      userSlug: "dan",
      artistSlugs: [],
      status: "in-progress",
      audioVersions: []
    });

    expect(result.success).toBe(false);
  });
});

