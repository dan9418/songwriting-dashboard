import matter from "gray-matter";
import { ZodError } from "zod";
import { badRequest, conflict, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";
import { deleteObject, getMarkdownObject, putMarkdownObject } from "@/lib/cloudflare/r2";
import type {
  NotebookPageFrontmatter,
  NotebookPageListItem,
  NotebookPageRecord
} from "@/lib/domain/models";
import {
  notebookFrontmatterSchema,
  type CreateNotebookPageBody
} from "@/lib/domain/schemas";
import { buildNotebookMarkdown } from "@/lib/notebook/markdown";
import { ensureNonEmptySlug } from "@/lib/utils/slug";

interface NotebookPageRow {
  slug: string;
  name: string;
  description: string;
  pageType: string;
  storagePath: string;
  createdAt: string;
  updatedAt: string;
}

function notebookPageStoragePath(slug: string): string {
  return `notebook/pages/${slug}.md`;
}

function toListItem(row: NotebookPageRow): NotebookPageListItem {
  return {
    slug: row.slug,
    name: row.name,
    description: row.description,
    pageType: row.pageType,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt
  };
}

function toFrontmatter(data: Record<string, unknown>): NotebookPageFrontmatter {
  try {
    const parsed = notebookFrontmatterSchema.parse(data);
    return {
      name: parsed.name,
      description: parsed.description,
      pageType: parsed.page_type,
      created: parsed.created,
      lastModified: parsed.last_modified
    };
  } catch (error) {
    if (error instanceof ZodError) {
      throw badRequest(
        "Notebook markdown must include valid frontmatter fields: name, description, page_type, created, and last_modified.",
        error.flatten()
      );
    }
    throw error;
  }
}

function parseNotebookMarkdown(rawContent: string) {
  const parsed = matter(rawContent);
  const frontmatter = toFrontmatter(parsed.data as Record<string, unknown>);
  return {
    parsed,
    frontmatter
  };
}

async function getNotebookPageRow(pageSlug: string): Promise<NotebookPageRow | null> {
  const rows = await queryD1<NotebookPageRow>(
    `
    SELECT
      slug,
      name,
      description,
      page_type AS pageType,
      storage_path AS storagePath,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notebook_pages
    WHERE slug = ?
    LIMIT 1;
    `,
    [pageSlug]
  );

  return rows[0] ?? null;
}

async function getNotebookPageRowOrThrow(pageSlug: string): Promise<NotebookPageRow> {
  const row = await getNotebookPageRow(pageSlug);
  if (!row) {
    throw notFound(`Notebook page not found: ${pageSlug}`);
  }
  return row;
}

export async function listNotebookPages(): Promise<NotebookPageListItem[]> {
  const rows = await queryD1<NotebookPageRow>(
    `
    SELECT
      slug,
      name,
      description,
      page_type AS pageType,
      storage_path AS storagePath,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM notebook_pages
    ORDER BY name COLLATE NOCASE ASC, slug ASC;
    `
  );

  return rows.map(toListItem);
}

export async function getNotebookPage(pageSlug: string): Promise<NotebookPageRecord> {
  const row = await getNotebookPageRowOrThrow(pageSlug);
  const object = await getMarkdownObject(row.storagePath);

  if (!object) {
    throw notFound(`Notebook page content not found for: ${pageSlug}`);
  }

  const { parsed, frontmatter } = parseNotebookMarkdown(object.content);

  return {
    ...toListItem(row),
    storagePath: row.storagePath,
    content: object.content,
    etag: object.etag,
    parsed: {
      data: {
        name: frontmatter.name,
        description: frontmatter.description,
        page_type: frontmatter.pageType,
        created: frontmatter.created,
        last_modified: frontmatter.lastModified
      },
      content: parsed.content
    }
  };
}

export async function createNotebookPage(input: CreateNotebookPageBody): Promise<NotebookPageRecord> {
  const slug = ensureNonEmptySlug(input.name);
  const existing = await getNotebookPageRow(slug);
  if (existing) {
    throw conflict(`Notebook page already exists: ${slug}`);
  }

  const now = new Date().toISOString();
  const storagePath = notebookPageStoragePath(slug);
  const markdown = buildNotebookMarkdown(
    {
      name: input.name,
      description: input.description,
      pageType: input.pageType,
      created: now,
      lastModified: now
    },
    input.content && input.content.trim().length > 0 ? input.content : `# ${input.name}\n\n`
  );

  await putMarkdownObject(storagePath, markdown);

  try {
    await queryD1(
      `
      INSERT INTO notebook_pages (
        slug,
        name,
        description,
        page_type,
        storage_path,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?);
      `,
      [slug, input.name, input.description, input.pageType, storagePath, now, now]
    );
  } catch (error) {
    await deleteObject(storagePath).catch(() => undefined);
    throw error;
  }

  return getNotebookPage(slug);
}

export async function updateNotebookPage(
  pageSlug: string,
  rawContent: string
): Promise<NotebookPageRecord> {
  const row = await getNotebookPageRowOrThrow(pageSlug);
  const previousObject = await getMarkdownObject(row.storagePath);
  if (!previousObject) {
    throw notFound(`Notebook page content not found for: ${pageSlug}`);
  }

  const { parsed, frontmatter } = parseNotebookMarkdown(rawContent);
  const nextUpdatedAt = new Date().toISOString();
  const normalizedMarkdown = buildNotebookMarkdown(
    {
      name: frontmatter.name,
      description: frontmatter.description,
      pageType: frontmatter.pageType,
      created: row.createdAt,
      lastModified: nextUpdatedAt
    },
    parsed.content
  );

  await putMarkdownObject(row.storagePath, normalizedMarkdown);

  try {
    await queryD1(
      `
      UPDATE notebook_pages
      SET
        name = ?,
        description = ?,
        page_type = ?,
        updated_at = ?
      WHERE slug = ?;
      `,
      [frontmatter.name, frontmatter.description, frontmatter.pageType, nextUpdatedAt, pageSlug]
    );
  } catch (error) {
    await putMarkdownObject(row.storagePath, previousObject.content).catch(() => undefined);
    throw error;
  }

  return getNotebookPage(pageSlug);
}

export async function deleteNotebookPage(pageSlug: string): Promise<{ deleted: boolean }> {
  const row = await getNotebookPageRow(pageSlug);
  if (!row) {
    return { deleted: false };
  }

  const previousObject = await getMarkdownObject(row.storagePath);

  if (previousObject) {
    await deleteObject(row.storagePath);
  }

  try {
    await queryD1(
      `
      DELETE FROM notebook_pages
      WHERE slug = ?;
      `,
      [pageSlug]
    );
  } catch (error) {
    if (previousObject) {
      await putMarkdownObject(row.storagePath, previousObject.content).catch(() => undefined);
    }
    throw error;
  }

  return { deleted: true };
}
