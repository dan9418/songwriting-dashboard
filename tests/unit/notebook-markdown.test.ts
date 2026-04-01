import { describe, expect, it } from "vitest";
import { buildNotebookMarkdown, extractNotebookBody } from "@/lib/notebook/markdown";

describe("notebook markdown helpers", () => {
  it("builds canonical notebook markdown with frontmatter", () => {
    const markdown = buildNotebookMarkdown(
      {
        name: "Lyric Fragments",
        description: "Loose fragments",
        pageType: "lyric-fragments",
        created: "2026-03-30T00:00:00.000Z",
        lastModified: "2026-03-30T00:00:00.000Z"
      },
      "# Header\n\nBody"
    );

    expect(markdown).toContain('name: "Lyric Fragments"');
    expect(markdown).toContain('page_type: "lyric-fragments"');
    expect(markdown).toContain("# Header");
  });

  it("extracts the markdown body from notebook frontmatter", () => {
    const markdown = `---
name: "Title Ideas"
description: "Candidate titles"
page_type: "title-ideas"
created: "2026-03-30T00:00:00.000Z"
last_modified: "2026-03-30T00:00:00.000Z"
---

- One
- Two
`;

    expect(extractNotebookBody(markdown).trim()).toBe("- One\n- Two");
  });
});
