import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/utils/slug";
import { createEntityBodySchema, trackEntitySchema } from "@/lib/domain/schemas";

describe("slug and schema validation", () => {
  it("slugifies mixed-case text safely", () => {
    expect(slugify(" Midnight Drive!! 2026 ")).toBe("midnight-drive-2026");
  });

  it("rejects invalid track entity payloads", () => {
    const result = trackEntitySchema.safeParse({
      slug: "Invalid Slug",
      name: "Test",
      artistSlugs: [],
      projectSlugs: [],
      audio: []
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid create-entity payload", () => {
    const result = createEntityBodySchema.safeParse({ name: "Midnight Drive" });
    expect(result.success).toBe(true);
  });
});
