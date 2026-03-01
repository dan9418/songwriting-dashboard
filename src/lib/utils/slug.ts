export function slugify(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-");
}

export function ensureNonEmptySlug(input: string): string {
  const slug = slugify(input);
  if (!slug) {
    throw new Error("Could not derive a slug from the provided value.");
  }
  return slug;
}

