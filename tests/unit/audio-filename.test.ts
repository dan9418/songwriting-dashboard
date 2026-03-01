import { describe, expect, it } from "vitest";
import {
  formatAudioFilename,
  isValidAudioFilename,
  parseAudioFilename,
  renameAudioFilename
} from "@/lib/audio/filename";

describe("audio filename utility", () => {
  it("parses a valid filename into required metadata", () => {
    const fileName = "Midnight Drive - demo 2 (02-14-25) [acoustic].mp3";
    const parsed = parseAudioFilename(fileName);
    expect(parsed.trackName).toBe("Midnight Drive");
    expect(parsed.category).toBe("demo");
    expect(parsed.versionNumber).toBe(2);
    expect(parsed.recordedDate).toBe("02-14-25");
    expect(parsed.description).toBe("acoustic");
    expect(parsed.slug).toBe("midnight-drive-demo-2-02-14-25");
  });

  it("formats and validates canonical filenames", () => {
    const fileName = formatAudioFilename({
      trackName: "Midnight Drive",
      category: "Demo",
      versionNumber: 2,
      recordedDate: "02-14-25",
      description: "acoustic"
    });
    expect(fileName).toBe("Midnight Drive - demo 2 (02-14-25) [acoustic].mp3");
    expect(isValidAudioFilename(fileName)).toBe(true);
    expect(isValidAudioFilename("broken.mp3")).toBe(false);
  });

  it("detects when a filename needs renaming", () => {
    const result = renameAudioFilename("Old Name - demo 1 (02-14-25).mp3", {
      trackName: "New Name",
      category: "demo",
      versionNumber: 1,
      recordedDate: "02-14-25"
    });
    expect(result.shouldRename).toBe(true);
    expect(result.nextFileName).toBe("New Name - demo 1 (02-14-25).mp3");
  });
});

