import { z } from "zod";
import { PROJECT_TYPES, TRACK_STATUSES } from "@/lib/domain/models";

const isoDateTimeString = z.iso.datetime({ offset: true });
const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case");

const tagSchema = z
  .string()
  .min(1)
  .max(50)
  .regex(/^[a-z0-9-_/]+$/i, "Tags may include letters, numbers, -, _, /");

const baseEntitySchema = z.object({
  slug: slugSchema,
  title: z.string().min(1),
  tags: z.array(tagSchema).default([]),
  createdAt: isoDateTimeString,
  updatedAt: isoDateTimeString
});

export const userSchema = baseEntitySchema.extend({
  displayName: z.string().min(1),
  timezone: z.string().min(1),
  defaultArtistSlugs: z.array(slugSchema).default([]),
  settings: z.object({
    archiveReadOnly: z.boolean().default(false)
  })
});

export const artistSchema = baseEntitySchema.extend({
  userSlug: slugSchema,
  aliases: z.array(z.string().min(1)).default([]),
  bio: z.string().optional()
});

export const projectTypeSchema = z.enum(PROJECT_TYPES);

export const projectSchema = baseEntitySchema.extend({
  userSlug: slugSchema,
  artistSlug: slugSchema,
  type: projectTypeSchema,
  trackSlugs: z
    .array(slugSchema)
    .default([])
    .refine((value) => new Set(value).size === value.length, "trackSlugs must not contain duplicates"),
  year: z.number().int().min(1900).max(3000).optional(),
  description: z.string().optional()
});

export const trackStatusSchema = z.enum(TRACK_STATUSES);

export const audioVersionSchema = z.object({
  fileName: z.string().min(1).regex(/\.(mp3|m4a)$/i, "Audio file must end with .mp3 or .m4a"),
  slug: slugSchema,
  category: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/i, "Category must be alphanumeric or hyphen"),
  versionNumber: z.number().int().positive(),
  recordedDate: z.string().regex(/^\d{2}-\d{2}-\d{2}$/, "Use MM-DD-YY format"),
  description: z.string().optional()
});

export const trackSchema = baseEntitySchema.extend({
  userSlug: slugSchema,
  artistSlugs: z.array(slugSchema).default([]),
  projectSlug: slugSchema.optional(),
  status: trackStatusSchema,
  bpm: z.number().int().positive().max(400).optional(),
  key: z.string().max(12).optional(),
  lyrics: z.string().optional(),
  notes: z.string().optional(),
  audioVersions: z.array(audioVersionSchema).default([])
});

export const fragmentSchema = baseEntitySchema.extend({
  userSlug: slugSchema,
  mood: z.string().optional(),
  text: z.string().min(1),
  relatedTrackSlugs: z.array(slugSchema).default([])
});

export type UserFrontmatter = z.infer<typeof userSchema>;
export type ArtistFrontmatter = z.infer<typeof artistSchema>;
export type ProjectFrontmatter = z.infer<typeof projectSchema>;
export type TrackFrontmatter = z.infer<typeof trackSchema>;
export type FragmentFrontmatter = z.infer<typeof fragmentSchema>;
