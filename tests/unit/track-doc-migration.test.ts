import { describe, expect, it } from "vitest";
import {
  buildCombinedTrackDocContent,
  extractCombinedTrackDocSections
} from "@/lib/tracks/track-doc-content";

describe("track doc migration helpers", () => {
  it("builds combined content for lyrics only", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: "Verse 1\nLine 2",
        chords: null,
        notes: null
      })
    ).toBe("# Lyrics\n\nVerse 1\nLine 2");
  });

  it("builds combined content for chords only", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: null,
        chords: "C F G",
        notes: null
      })
    ).toBe("# Chords\n\nC F G");
  });

  it("builds combined content for notes only", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: null,
        chords: null,
        notes: "Bridge needs work"
      })
    ).toBe("# Notes\n\nBridge needs work");
  });

  it("builds combined content for lyrics and chords in section order", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: "L1",
        chords: "C G Am F",
        notes: null
      })
    ).toBe("# Lyrics\n\nL1\n\n# Chords\n\nC G Am F");
  });

  it("builds combined content for lyrics and notes in section order", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: "L1",
        chords: null,
        notes: "Try half-time chorus"
      })
    ).toBe("# Lyrics\n\nL1\n\n# Notes\n\nTry half-time chorus");
  });

  it("builds combined content for all three source files", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: "Lyrics body",
        chords: "Dm Bb F C",
        notes: "Capo 3"
      })
    ).toBe("# Lyrics\n\nLyrics body\n\n# Chords\n\nDm Bb F C\n\n# Notes\n\nCapo 3");
  });

  it("preserves empty bodies under their section header", () => {
    expect(
      buildCombinedTrackDocContent({
        lyrics: "",
        chords: null,
        notes: "Filled"
      })
    ).toBe("# Lyrics\n\n\n\n# Notes\n\nFilled");
  });

  it("preserves source body text verbatim apart from section wrappers", () => {
    const lyricsBody = "# Verse\n\nLine 1\n\nLine 2\n";
    expect(
      buildCombinedTrackDocContent({
        lyrics: lyricsBody,
        chords: null,
        notes: null
      })
    ).toBe(`# Lyrics\n\n${lyricsBody}`);
  });

  it("recognizes content previously built by the migration helper", () => {
    const content = buildCombinedTrackDocContent({
      lyrics: "One",
      chords: "Two",
      notes: "Three"
    });

    expect(extractCombinedTrackDocSections(content)).toEqual({
      lyrics: "One",
      chords: "Two",
      notes: "Three"
    });
  });
});
