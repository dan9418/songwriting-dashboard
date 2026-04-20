export type TrackQueryMatchMode = "all" | "any";
export type TrackSortKey =
  | "name"
  | "projects"
  | "artists"
  | "tags"
  | "notes"
  | "audio";
export type TrackSortDirection = "asc" | "desc";
export const TRACK_QUERY_UNASSIGNED_VALUE = "__unassigned__";

export interface TrackQueryState {
  title: string;
  matchMode: TrackQueryMatchMode;
  artistInclude: string[];
  artistExclude: string[];
  projectInclude: string[];
  projectExclude: string[];
  tagInclude: string[];
  tagExclude: string[];
  sortKey: TrackSortKey;
  sortDirection: TrackSortDirection;
}

export interface TrackQueryItem {
  slug: string;
  name: string;
  artists: Array<{ slug: string; name: string }>;
  projects: Array<{ slug: string; name: string }>;
  tags: Array<{ slug: string; name: string }>;
  hasNotes: boolean;
  audioCount: number;
}

export const DEFAULT_TRACK_QUERY_STATE: TrackQueryState = {
  title: "",
  matchMode: "all",
  artistInclude: [],
  artistExclude: [],
  projectInclude: [],
  projectExclude: [],
  tagInclude: [],
  tagExclude: [],
  sortKey: "name",
  sortDirection: "asc"
};

function normalizeList(values: Iterable<string>): string[] {
  return Array.from(new Set(Array.from(values).map((value) => value.trim()).filter(Boolean)));
}

function parseList(searchParams: URLSearchParams, key: string): string[] {
  return normalizeList(searchParams.getAll(key).flatMap((value) => value.split(",")));
}

function normalizeMatchMode(value: string | null): TrackQueryMatchMode {
  return value === "any" ? "any" : "all";
}

function normalizeSortKey(value: string | null): TrackSortKey {
  if (
    value === "projects" ||
    value === "artists" ||
    value === "tags" ||
    value === "notes" ||
    value === "audio"
  ) {
    return value;
  }
  return "name";
}

function normalizeSortDirection(value: string | null): TrackSortDirection {
  return value === "desc" ? "desc" : "asc";
}

export function parseTrackQueryState(searchParams: URLSearchParams): TrackQueryState {
  return {
    title: searchParams.get("title")?.trim() ?? "",
    matchMode: normalizeMatchMode(searchParams.get("match")),
    artistInclude: parseList(searchParams, "artistIn"),
    artistExclude: parseList(searchParams, "artistOut"),
    projectInclude: parseList(searchParams, "projectIn"),
    projectExclude: parseList(searchParams, "projectOut"),
    tagInclude: parseList(searchParams, "tagIn"),
    tagExclude: parseList(searchParams, "tagOut"),
    sortKey: normalizeSortKey(searchParams.get("sort")),
    sortDirection: normalizeSortDirection(searchParams.get("dir"))
  };
}

export function buildTrackQuerySearchParams(state: TrackQueryState): URLSearchParams {
  const searchParams = new URLSearchParams();

  if (state.title.trim()) {
    searchParams.set("title", state.title.trim());
  }
  if (state.matchMode !== DEFAULT_TRACK_QUERY_STATE.matchMode) {
    searchParams.set("match", state.matchMode);
  }
  for (const value of normalizeList(state.artistInclude)) {
    searchParams.append("artistIn", value);
  }
  for (const value of normalizeList(state.artistExclude)) {
    searchParams.append("artistOut", value);
  }
  for (const value of normalizeList(state.projectInclude)) {
    searchParams.append("projectIn", value);
  }
  for (const value of normalizeList(state.projectExclude)) {
    searchParams.append("projectOut", value);
  }
  for (const value of normalizeList(state.tagInclude)) {
    searchParams.append("tagIn", value);
  }
  for (const value of normalizeList(state.tagExclude)) {
    searchParams.append("tagOut", value);
  }
  if (state.sortKey !== DEFAULT_TRACK_QUERY_STATE.sortKey) {
    searchParams.set("sort", state.sortKey);
  }
  if (state.sortDirection !== DEFAULT_TRACK_QUERY_STATE.sortDirection) {
    searchParams.set("dir", state.sortDirection);
  }

  return searchParams;
}

export function updateTrackQueryState(
  state: TrackQueryState,
  patch: Partial<TrackQueryState>
): TrackQueryState {
  return {
    ...state,
    ...patch
  };
}

export function equalTrackQueryState(left: TrackQueryState, right: TrackQueryState): boolean {
  return (
    left.title === right.title &&
    left.matchMode === right.matchMode &&
    left.sortKey === right.sortKey &&
    left.sortDirection === right.sortDirection &&
    left.artistInclude.join("|") === right.artistInclude.join("|") &&
    left.artistExclude.join("|") === right.artistExclude.join("|") &&
    left.projectInclude.join("|") === right.projectInclude.join("|") &&
    left.projectExclude.join("|") === right.projectExclude.join("|") &&
    left.tagInclude.join("|") === right.tagInclude.join("|") &&
    left.tagExclude.join("|") === right.tagExclude.join("|")
  );
}

function matchesIncludedValues(currentValues: string[], selectedValues: string[]): boolean | null {
  if (selectedValues.length === 0) {
    return null;
  }
  return selectedValues.some((value) =>
    value === TRACK_QUERY_UNASSIGNED_VALUE ? currentValues.length === 0 : currentValues.includes(value)
  );
}

function matchesExcludedValues(currentValues: string[], selectedValues: string[]): boolean {
  if (selectedValues.length === 0) {
    return false;
  }
  return selectedValues.some((value) =>
    value === TRACK_QUERY_UNASSIGNED_VALUE ? currentValues.length === 0 : currentValues.includes(value)
  );
}

export function matchesTrackQuery(item: TrackQueryItem, state: TrackQueryState): boolean {
  const positiveChecks: boolean[] = [];
  const titleNeedle = state.title.trim().toLocaleLowerCase();

  if (titleNeedle) {
    positiveChecks.push(item.name.toLocaleLowerCase().includes(titleNeedle));
  }

  const artistMatch = matchesIncludedValues(
    item.artists.map((artist) => artist.slug),
    state.artistInclude
  );
  if (artistMatch !== null) {
    positiveChecks.push(artistMatch);
  }

  const projectMatch = matchesIncludedValues(
    item.projects.map((project) => project.slug),
    state.projectInclude
  );
  if (projectMatch !== null) {
    positiveChecks.push(projectMatch);
  }

  const tagMatch = matchesIncludedValues(
    item.tags.map((tag) => tag.slug),
    state.tagInclude
  );
  if (tagMatch !== null) {
    positiveChecks.push(tagMatch);
  }

  const positivePass =
    positiveChecks.length === 0
      ? true
      : state.matchMode === "all"
        ? positiveChecks.every(Boolean)
        : positiveChecks.some(Boolean);

  if (!positivePass) {
    return false;
  }

  const excluded =
    matchesExcludedValues(
      item.artists.map((artist) => artist.slug),
      state.artistExclude
    ) ||
    matchesExcludedValues(
      item.projects.map((project) => project.slug),
      state.projectExclude
    ) ||
    matchesExcludedValues(
      item.tags.map((tag) => tag.slug),
      state.tagExclude
    );

  return !excluded;
}

function labelListValue(values: Array<{ name: string }>): string {
  return values
    .map((value) => value.name)
    .sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }))
    .join(", ");
}

function compareText(left: string, right: string): number {
  return left.localeCompare(right, undefined, { sensitivity: "base" });
}

function compareNumber(left: number, right: number): number {
  return left - right;
}

function compareBoolean(left: boolean, right: boolean): number {
  return Number(left) - Number(right);
}

export function sortTracks<T extends TrackQueryItem>(items: T[], state: TrackQueryState): T[] {
  const sorted = [...items];

  sorted.sort((left, right) => {
    let result = 0;

    if (state.sortKey === "name") {
      result = compareText(left.name, right.name);
    } else if (state.sortKey === "projects") {
      result = compareText(labelListValue(left.projects), labelListValue(right.projects));
    } else if (state.sortKey === "artists") {
      result = compareText(labelListValue(left.artists), labelListValue(right.artists));
    } else if (state.sortKey === "tags") {
      result = compareText(labelListValue(left.tags), labelListValue(right.tags));
    } else if (state.sortKey === "notes") {
      result = compareBoolean(left.hasNotes, right.hasNotes);
    } else if (state.sortKey === "audio") {
      result = compareNumber(left.audioCount, right.audioCount);
    }

    if (result === 0) {
      result = compareText(left.name, right.name);
    }
    if (result === 0) {
      result = compareText(left.slug, right.slug);
    }

    return state.sortDirection === "asc" ? result : -result;
  });

  return sorted;
}

export function filterAndSortTracks<T extends TrackQueryItem>(items: T[], state: TrackQueryState): T[] {
  return sortTracks(items.filter((item) => matchesTrackQuery(item, state)), state);
}
