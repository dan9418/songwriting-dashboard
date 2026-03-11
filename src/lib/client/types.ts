export interface MarkdownEntity<T> {
  data: T;
  content: string;
}

export interface ArtistData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  aliases: string[];
  bio?: string;
}

export interface ProjectData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  type: "album" | "ep" | "single" | "setlist";
  artistSlug: string;
  trackSlugs: string[];
  year?: number;
  description?: string;
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

export interface TrackListItem {
  slug: string;
  projectSlug: string | null;
  projectPosition: number | null;
  lyricsPath: string | null;
  notesPath: string | null;
  chordsPath: string | null;
  audioCount: number;
  noteCount: number;
  demoCount: number;
  liveCount: number;
}

export interface TrackData {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
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

export interface FragmentImportSummary {
  loaded: number;
  total: number;
  failed: number;
}

export interface CreatedEntityResponse {
  slug: string;
  name: string;
}
