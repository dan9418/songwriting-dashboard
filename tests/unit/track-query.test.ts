import { describe, expect, it } from "vitest";
import {
  buildTrackQuerySearchParams,
  filterAndSortTracks,
  parseTrackQueryState,
  type TrackQueryItem,
  type TrackQueryState
} from "@/lib/tracks/query";

const SAMPLE_ITEMS: TrackQueryItem[] = [
  {
    slug: "midnight-drive",
    name: "Midnight Drive",
    artists: [{ slug: "dan", name: "Dan" }],
    projects: [{ slug: "night-runs", name: "Night Runs" }],
    tags: [{ slug: "keeper", name: "Keeper" }],
    hasLyrics: true,
    hasChords: false,
    hasNotes: true,
    audioCount: 3
  },
  {
    slug: "sunrise-demo",
    name: "Sunrise Demo",
    artists: [{ slug: "mia", name: "Mia" }],
    projects: [{ slug: "daybreak", name: "Daybreak" }],
    tags: [{ slug: "draft", name: "Draft" }],
    hasLyrics: false,
    hasChords: true,
    hasNotes: false,
    audioCount: 1
  },
  {
    slug: "night-signal",
    name: "Night Signal",
    artists: [
      { slug: "dan", name: "Dan" },
      { slug: "mia", name: "Mia" }
    ],
    projects: [{ slug: "night-runs", name: "Night Runs" }],
    tags: [{ slug: "draft", name: "Draft" }],
    hasLyrics: true,
    hasChords: true,
    hasNotes: false,
    audioCount: 2
  }
];

describe("track query utilities", () => {
  it("round-trips structured search params", () => {
    const state: TrackQueryState = {
      title: "night",
      matchMode: "any",
      artistInclude: ["dan"],
      artistExclude: ["mia"],
      projectInclude: ["night-runs"],
      projectExclude: ["daybreak"],
      tagInclude: ["keeper"],
      tagExclude: ["draft"],
      sortKey: "audio",
      sortDirection: "desc"
    };

    const roundTrip = parseTrackQueryState(buildTrackQuerySearchParams(state));
    expect(roundTrip).toEqual(state);
  });

  it("filters title substring matches", () => {
    const result = filterAndSortTracks(SAMPLE_ITEMS, {
      title: "night",
      matchMode: "all",
      artistInclude: [],
      artistExclude: [],
      projectInclude: [],
      projectExclude: [],
      tagInclude: [],
      tagExclude: [],
      sortKey: "name",
      sortDirection: "asc"
    });

    expect(result.map((item) => item.slug)).toEqual(["midnight-drive", "night-signal"]);
  });

  it("combines positive criteria with all-vs-any semantics and respects exclusions", () => {
    const allMode = filterAndSortTracks(SAMPLE_ITEMS, {
      title: "",
      matchMode: "all",
      artistInclude: ["dan"],
      artistExclude: [],
      projectInclude: ["night-runs"],
      projectExclude: [],
      tagInclude: ["keeper"],
      tagExclude: [],
      sortKey: "name",
      sortDirection: "asc"
    });
    const anyMode = filterAndSortTracks(SAMPLE_ITEMS, {
      title: "",
      matchMode: "any",
      artistInclude: ["dan"],
      artistExclude: [],
      projectInclude: [],
      projectExclude: [],
      tagInclude: ["draft"],
      tagExclude: ["keeper"],
      sortKey: "name",
      sortDirection: "asc"
    });

    expect(allMode.map((item) => item.slug)).toEqual(["midnight-drive"]);
    expect(anyMode.map((item) => item.slug)).toEqual(["night-signal", "sunrise-demo"]);
  });

  it("sorts numeric and boolean columns", () => {
    const byAudio = filterAndSortTracks(SAMPLE_ITEMS, {
      title: "",
      matchMode: "all",
      artistInclude: [],
      artistExclude: [],
      projectInclude: [],
      projectExclude: [],
      tagInclude: [],
      tagExclude: [],
      sortKey: "audio",
      sortDirection: "desc"
    });
    const byLyrics = filterAndSortTracks(SAMPLE_ITEMS, {
      title: "",
      matchMode: "all",
      artistInclude: [],
      artistExclude: [],
      projectInclude: [],
      projectExclude: [],
      tagInclude: [],
      tagExclude: [],
      sortKey: "lyrics",
      sortDirection: "desc"
    });

    expect(byAudio.map((item) => item.slug)).toEqual(["midnight-drive", "night-signal", "sunrise-demo"]);
    expect(byLyrics.map((item) => item.slug)).toEqual(["night-signal", "midnight-drive", "sunrise-demo"]);
  });
});
