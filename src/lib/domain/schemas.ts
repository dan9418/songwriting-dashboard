import { z } from "zod";
import { AUDIO_TYPES, PROJECT_TYPES } from "@/lib/domain/models";

export const slugSchema = z
  .string()
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be kebab-case");

export const isoDateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD");

export const nameSchema = z.string().trim().min(1);
export const descriptionSchema = z.string();

function uniqueSlugListSchema(fieldName: string) {
  return z
    .array(slugSchema)
    .default([])
    .refine((value) => new Set(value).size === value.length, `${fieldName} must not contain duplicates`);
}

export const createEntityBodySchema = z.object({
  name: nameSchema
});

export const projectTypeSchema = z.enum(PROJECT_TYPES);
export const audioTypeSchema = z.enum(AUDIO_TYPES);

export const artistEntitySchema = z.object({
  slug: slugSchema,
  name: nameSchema,
  description: descriptionSchema.default(""),
  projectSlugs: uniqueSlugListSchema("projectSlugs"),
  trackSlugs: uniqueSlugListSchema("trackSlugs")
});

export const projectEntitySchema = z.object({
  slug: slugSchema,
  name: nameSchema,
  description: descriptionSchema.default(""),
  type: projectTypeSchema,
  releaseDate: isoDateSchema.nullable(),
  remasterDate: isoDateSchema.nullable(),
  artistSlugs: uniqueSlugListSchema("artistSlugs"),
  trackSlugs: uniqueSlugListSchema("trackSlugs")
});

export const trackAudioSchema = z.object({
  slug: slugSchema,
  type: audioTypeSchema,
  typeVersion: z.number().int().positive(),
  description: z.string().nullable(),
  date: isoDateSchema,
  dateOverride: z.string().nullable()
});

export const trackEntitySchema = z.object({
  slug: slugSchema,
  name: nameSchema,
  artistSlugs: uniqueSlugListSchema("artistSlugs"),
  projectSlugs: uniqueSlugListSchema("projectSlugs"),
  audio: z.array(trackAudioSchema).default([])
});

export const updateArtistBodySchema = z.object({
  slug: slugSchema.optional(),
  name: nameSchema.optional(),
  description: z.string().optional()
});

export const updateProjectBodySchema = z.object({
  slug: slugSchema.optional(),
  name: nameSchema.optional(),
  description: z.string().optional(),
  type: projectTypeSchema.optional(),
  releaseDate: z.union([isoDateSchema, z.null()]).optional(),
  remasterDate: z.union([isoDateSchema, z.null()]).optional(),
  artistSlugs: uniqueSlugListSchema("artistSlugs").optional(),
  trackSlugs: uniqueSlugListSchema("trackSlugs").optional(),
  trackNameUpdates: z
    .array(
      z.object({
        slug: slugSchema,
        name: nameSchema
      })
    )
    .optional()
});

export const updateTrackBodySchema = z.object({
  slug: slugSchema.optional(),
  name: nameSchema.optional(),
  artistSlugs: uniqueSlugListSchema("artistSlugs").optional(),
  projectSlugs: uniqueSlugListSchema("projectSlugs").optional()
});

export type ArtistEntityRecord = z.infer<typeof artistEntitySchema>;
export type ProjectEntityRecord = z.infer<typeof projectEntitySchema>;
export type TrackAudioRecord = z.infer<typeof trackAudioSchema>;
export type TrackEntityRecord = z.infer<typeof trackEntitySchema>;
