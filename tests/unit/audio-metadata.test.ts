import { describe, expect, it } from "vitest";
import {
  audioExtensionForFileName,
  buildAudioObjectKey,
  contentTypeForAudioExtension,
  defaultAudioName
} from "@/lib/audio/metadata";

describe("audio metadata helpers", () => {
  it("recognizes supported audio extensions", () => {
    expect(audioExtensionForFileName("take.MP3")).toBe(".mp3");
    expect(audioExtensionForFileName("take.m4a")).toBe(".m4a");
    expect(audioExtensionForFileName("take.wav")).toBeNull();
  });

  it("maps extensions to content types", () => {
    expect(contentTypeForAudioExtension(".mp3")).toBe("audio/mpeg");
    expect(contentTypeForAudioExtension(".m4a")).toBe("audio/mp4");
    expect(contentTypeForAudioExtension(".mp4")).toBe("audio/mp4");
  });

  it("builds id-based object keys and default names", () => {
    expect(buildAudioObjectKey("midnight-drive", "audio-id", ".m4a")).toBe(
      "tracks/midnight-drive/audio/audio-id.m4a"
    );
    expect(defaultAudioName("demo", 1)).toBe("demo 2");
  });
});
