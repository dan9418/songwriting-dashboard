export interface TrackMetadataOption {
  slug: string;
  name: string;
}

export interface TrackAudioTableItem {
  slug: string;
  fileName: string;
  fileHref: string | null;
  type: string;
  typeVersion: number;
  description: string | null;
  date: string;
  dateOverride: string | null;
}

export interface TrackQuickEditRecord {
  slug: string;
  name: string;
  artistSlugs: string[];
  projectSlugs: string[];
  tagSlugs: string[];
  audio: TrackAudioTableItem[];
}
