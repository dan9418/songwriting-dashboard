export const PROJECT_TYPES = ["album", "ep", "single", "setlist"] as const;
export type ProjectType = (typeof PROJECT_TYPES)[number];

export const TRACK_STATUSES = ["idea", "in-progress", "recorded", "released"] as const;
export type TrackStatus = (typeof TRACK_STATUSES)[number];

export interface BaseEntity {
  slug: string;
  title: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface User extends BaseEntity {
  displayName: string;
  timezone: string;
  defaultArtistSlugs: string[];
  settings: {
    archiveReadOnly: boolean;
  };
}

export interface Artist extends BaseEntity {
  aliases: string[];
  bio?: string;
}

export interface Project extends BaseEntity {
  artistSlug: string;
  type: ProjectType;
  trackSlugs: string[];
  year?: number;
  description?: string;
}

export interface AudioVersionMetadata {
  fileName: string;
  slug: string;
  category: string;
  versionNumber: number;
  recordedDate: string;
  description?: string;
}

export interface Track extends BaseEntity {
  artistSlugs: string[];
  projectSlug?: string;
  status: TrackStatus;
  bpm?: number;
  key?: string;
  lyrics?: string;
  notes?: string;
  audioVersions: AudioVersionMetadata[];
}
