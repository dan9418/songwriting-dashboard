export interface MarkdownEntity<T> {
  data: T;
  content: string;
}

export interface ArtistData {
  slug: string;
  title: string;
  tags: string[];
  userSlug: string;
}

export interface ProjectData {
  slug: string;
  title: string;
  tags: string[];
  type: "album" | "ep" | "single" | "setlist";
  userSlug: string;
  artistSlug: string;
}

export interface AudioVersionData {
  fileName: string;
  slug: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
}

export interface TrackImportSummary {
  loaded: number;
  matched: number;
  total: number;
  failed: number;
}

export interface TrackData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userSlug: string;
  artistSlugs: string[];
  projectSlug?: string;
  status: "idea" | "in-progress" | "recorded" | "released";
  bpm?: number;
  key?: string;
  lyrics?: string;
  notes?: string;
  audioVersions: AudioVersionData[];
}

export interface FragmentData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userSlug: string;
  mood?: string;
  text: string;
  relatedTrackSlugs: string[];
}

export interface UserData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  displayName: string;
  timezone: string;
  defaultArtistSlugs: string[];
  settings: {
    archiveReadOnly: boolean;
  };
}

export interface SearchResult {
  id: string;
  type: "artist" | "project" | "track" | "fragment";
  slug: string;
  title: string;
  tags: string[];
  path: string;
  snippet: string;
  score: number;
}

export interface TrackImportSummary {
  loaded: number;
  matched: number;
  total: number;
  failed: number;
}

export interface FragmentImportSummary {
  loaded: number;
  total: number;
  failed: number;
}
