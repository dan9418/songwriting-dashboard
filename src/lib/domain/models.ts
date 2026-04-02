export const PROJECT_TYPES = ["album", "ep", "single", "setlist"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const AUDIO_TYPES = ["note", "demo", "live"] as const;
export type AudioType = (typeof AUDIO_TYPES)[number];

export interface ArtistEntity {
  slug: string;
  name: string;
  description: string;
  projectSlugs: string[];
  trackSlugs: string[];
}

export interface ProjectEntity {
  slug: string;
  name: string;
  description: string;
  type: ProjectType;
  releaseDate: string | null;
  remasterDate: string | null;
  artistSlugs: string[];
  trackSlugs: string[];
}

export interface TrackAudioEntity {
  slug: string;
  type: AudioType;
  typeVersion: number;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

export interface TrackEntity {
  slug: string;
  name: string;
  artistSlugs: string[];
  projectSlugs: string[];
  tagSlugs: string[];
  audio: TrackAudioEntity[];
}

export interface TagEntity {
  slug: string;
  name: string;
  trackSlugs: string[];
}

export interface NotebookPageFrontmatter {
  name: string;
  description: string;
  pageType: string;
  created: string;
  lastModified: string;
}

export interface NotebookPageListItem {
  slug: string;
  name: string;
  description: string;
  pageType: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotebookPageRecord extends NotebookPageListItem {
  storagePath: string;
  content: string;
  etag: string | null;
  parsed: {
    data: Record<string, unknown>;
    content: string;
  };
}
