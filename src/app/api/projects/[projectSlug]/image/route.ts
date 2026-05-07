import path from "node:path";
import { apiErrorResponse, badRequest, conflict, notFound } from "@/lib/api/errors";
import { ok } from "@/lib/api/response";
import { queryD1 } from "@/lib/cloudflare/d1";
import { getPrimaryDirectProjectImage } from "@/lib/cloudflare/images";
import { deleteObject, putObjectData } from "@/lib/cloudflare/r2";

export const runtime = "nodejs";

const IMAGE_CONTENT_TYPES_BY_EXTENSION = new Map<string, string>([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"]
]);

interface ProjectExistsRow {
  slug: string;
}

interface ImageRow {
  slug: string;
  path: string;
}

interface ImageReferenceCountsRow {
  artistRefs: number | string;
  projectRefs: number | string;
  trackRefs: number | string;
}

function toInt(value: number | string | null | undefined): number {
  if (typeof value === "number") {
    return value;
  }
  return Number(value ?? 0);
}

async function assertProjectExists(projectSlug: string): Promise<void> {
  const rows = await queryD1<ProjectExistsRow>(
    `
    SELECT slug
    FROM projects
    WHERE slug = ?
    LIMIT 1;
    `,
    [projectSlug]
  );

  if (rows.length === 0) {
    throw notFound(`Project not found: ${projectSlug}`);
  }
}

function buildProjectImagePath(projectSlug: string, extension: string): string {
  return `images/${projectSlug}-front${extension}`;
}

function buildProjectImageSlug(projectSlug: string): string {
  return `${projectSlug}-front`;
}

function normalizeImageUpload(fileEntry: File): { extension: string; contentType: string } {
  if (!fileEntry.name.trim()) {
    throw badRequest("Uploaded image must have a filename.");
  }

  const extension = path.extname(fileEntry.name).toLowerCase();
  const contentType = IMAGE_CONTENT_TYPES_BY_EXTENSION.get(extension);
  if (!contentType) {
    throw badRequest("Unsupported image format. Use JPG, PNG, WEBP, or GIF.");
  }

  if (fileEntry.type && !fileEntry.type.startsWith("image/")) {
    throw badRequest("Uploaded file must be an image.");
  }

  return { extension, contentType };
}

async function getImageRow(imageSlug: string): Promise<ImageRow | null> {
  const rows = await queryD1<ImageRow>(
    `
    SELECT slug, path
    FROM images
    WHERE slug = ?
    LIMIT 1;
    `,
    [imageSlug]
  );
  return rows[0] ?? null;
}

async function getImageReferenceCounts(imageSlug: string): Promise<{
  artistRefs: number;
  projectRefs: number;
  trackRefs: number;
}> {
  const rows = await queryD1<ImageReferenceCountsRow>(
    `
    SELECT
      (SELECT COUNT(*) FROM artist_images WHERE image_slug = ?) AS artistRefs,
      (SELECT COUNT(*) FROM project_images WHERE image_slug = ?) AS projectRefs,
      (SELECT COUNT(*) FROM track_images WHERE image_slug = ?) AS trackRefs;
    `,
    [imageSlug, imageSlug, imageSlug]
  );
  const row = rows[0];
  return {
    artistRefs: toInt(row?.artistRefs),
    projectRefs: toInt(row?.projectRefs),
    trackRefs: toInt(row?.trackRefs)
  };
}

async function deleteImageIfOrphaned(imageSlug: string, imagePath: string): Promise<void> {
  const refs = await getImageReferenceCounts(imageSlug);
  if (refs.artistRefs > 0 || refs.projectRefs > 0 || refs.trackRefs > 0) {
    return;
  }

  await queryD1(`DELETE FROM images WHERE slug = ?;`, [imageSlug]);
  await deleteObject(imagePath).catch(() => undefined);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    await assertProjectExists(projectSlug);

    const formData = await request.formData();
    const fileEntry = formData.get("file");
    if (!(fileEntry instanceof File)) {
      throw badRequest("Upload must include a single image file.");
    }

    const { extension, contentType } = normalizeImageUpload(fileEntry);
    const nextImageSlug = buildProjectImageSlug(projectSlug);
    const nextImagePath = buildProjectImagePath(projectSlug, extension);
    const currentDirectImage = await getPrimaryDirectProjectImage(projectSlug);
    const canonicalImage = await getImageRow(nextImageSlug);

    if (canonicalImage) {
      const refs = await getImageReferenceCounts(nextImageSlug);
      const expectedProjectRefs = currentDirectImage?.imageSlug === nextImageSlug ? 1 : 0;
      if (refs.artistRefs > 0 || refs.projectRefs > expectedProjectRefs || refs.trackRefs > 0) {
        throw conflict(`Image slug already belongs to another record: ${nextImageSlug}`);
      }
    }

    const payload = new Uint8Array(await fileEntry.arrayBuffer());
    await putObjectData(nextImagePath, payload, contentType);

    try {
      await queryD1(
        `
        INSERT INTO images (slug, path)
        VALUES (?, ?)
        ON CONFLICT(slug) DO UPDATE SET
          path = excluded.path;
        `,
        [nextImageSlug, nextImagePath]
      );
      await queryD1(
        `
        INSERT INTO project_images (project_slug, image_slug)
        VALUES (?, ?)
        ON CONFLICT(project_slug, image_slug) DO NOTHING;
        `,
        [projectSlug, nextImageSlug]
      );

      if (currentDirectImage && currentDirectImage.imageSlug !== nextImageSlug) {
        await queryD1(`DELETE FROM project_images WHERE project_slug = ? AND image_slug = ?;`, [
          projectSlug,
          currentDirectImage.imageSlug
        ]);
        await deleteImageIfOrphaned(currentDirectImage.imageSlug, currentDirectImage.imagePath);
      }

      if (
        currentDirectImage?.imageSlug === nextImageSlug &&
        currentDirectImage.imagePath !== nextImagePath
      ) {
        await deleteObject(currentDirectImage.imagePath).catch(() => undefined);
      }
    } catch (error) {
      if (!canonicalImage || canonicalImage.path !== nextImagePath) {
        await deleteObject(nextImagePath).catch(() => undefined);
      }
      throw error;
    }

    return ok({ imageSlug: nextImageSlug }, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ projectSlug: string }> }
) {
  try {
    const { projectSlug } = await context.params;
    await assertProjectExists(projectSlug);

    const currentDirectImage = await getPrimaryDirectProjectImage(projectSlug);
    if (!currentDirectImage) {
      throw notFound(`Project does not have a direct image: ${projectSlug}`);
    }

    await queryD1(`DELETE FROM project_images WHERE project_slug = ? AND image_slug = ?;`, [
      projectSlug,
      currentDirectImage.imageSlug
    ]);
    await deleteImageIfOrphaned(currentDirectImage.imageSlug, currentDirectImage.imagePath);

    return ok({ imageSlug: null });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
