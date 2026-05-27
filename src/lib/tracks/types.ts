export interface TrackMetadataOption {
  slug: string;
  name: string;
}

export interface TrackAudioTableItem {
  id: string;
  name: string;
  fileName: string;
  fileHref: string | null;
  fileMissing: boolean;
  type: string;
  date: string;
  dateDescriptor: string | null;
  contentType: string | null;
}

export interface TrackQuickEditRecord {
  slug: string;
  name: string;
  artistSlugs: string[];
  projectSlugs: string[];
  tagSlugs: string[];
  directImageSlug: string | null;
  displayImageSlug: string | null;
  audio: TrackAudioTableItem[];
}
