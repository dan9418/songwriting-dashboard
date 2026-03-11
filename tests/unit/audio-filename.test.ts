import { describe, expect, it } from "vitest";
import {
  formatAudioFilename,
  isValidAudioFilename,
  parseAudioFilename,
  renameAudioFilename
} from "@/lib/audio/filename";

describe("audio filename utility", () => {
  it("parses a valid filename into required metadata", () => {
    const fileName = "midnight-drive_demo_v2_02-14-25_acoustic.m4a";
    const parsed = parseAudioFilename(fileName);
    expect(parsed.trackSlug).toBe("midnight-drive");
    expect(parsed.category).toBe("demo");
    expect(parsed.versionNumber).toBe(2);
    expect(parsed.recordedDate).toBe("02-14-25");
    expect(parsed.description).toBe("acoustic");
    expect(parsed.extension).toBe(".m4a");
    expect(parsed.slug).toBe("midnight-drive_demo_v2_02-14-25_acoustic");
  });

  it("formats and validates canonical filenames", () => {
    const fileName = formatAudioFilename({
      trackSlug: "midnight-drive",
      category: "Demo",
      versionNumber: 2,
      recordedDate: "02-14-25",
      description: "acoustic"
    });
    expect(fileName).toBe("midnight-drive_demo_v2_02-14-25_acoustic.mp3");
    expect(isValidAudioFilename(fileName)).toBe(true);
    expect(isValidAudioFilename("midnight-drive_demo_v2_02-14-25.m4a")).toBe(true);
    expect(isValidAudioFilename("midnight-drive_demo_v2_02-14-25.mp4")).toBe(true);
    expect(isValidAudioFilename("broken.mp3")).toBe(false);
  });

  it("detects when a filename needs renaming", () => {
    const result = renameAudioFilename("old-name_demo_v1_02-14-25.m4a", {
      trackSlug: "new-name",
      category: "demo",
      versionNumber: 1,
      recordedDate: "02-14-25",
      extension: ".m4a"
    });
    expect(result.shouldRename).toBe(true);
    expect(result.nextFileName).toBe("new-name_demo_v1_02-14-25.m4a");
  });
});
