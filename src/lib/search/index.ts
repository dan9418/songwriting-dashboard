import MiniSearch from "minisearch";
import path from "node:path";
import { DATA_ROOT } from "@/lib/fs/paths";
import { listMarkdownFilesRecursive } from "@/lib/fs/walk";
import { fragmentSchema, projectSchema, trackSchema, artistSchema } from "@/lib/domain/schemas";
import { readMarkdownFile } from "@/lib/fs/markdown";

export type SearchType = "artist" | "project" | "track" | "fragment";

export interface SearchDocument {
  id: string;
  type: SearchType;
  slug: string;
  title: string;
  tags: string[];
  path: string;
  content: string;
}

export interface SearchQuery {
  q: string;
  tags?: string[];
  type?: SearchType;
}

export interface SearchResultItem {
  id: string;
  type: SearchType;
  slug: string;
  title: string;
  tags: string[];
  path: string;
  snippet: string;
  score: number;
}

function normalizePath(filePath: string): string {
  return filePath.split(path.sep).join("/");
}

function inferTypeFromPath(filePath: string): SearchType | null {
  if (filePath.endsWith("/artist.md")) {
    return "artist";
  }
  if (filePath.endsWith("/project.md")) {
    return "project";
  }
  if (filePath.endsWith("/track.md") && filePath.includes("/tracks/")) {
    return "track";
  }
  if (filePath.endsWith("/fragment.md") && filePath.includes("/fragments/")) {
    return "fragment";
  }
  return null;
}

async function fileToSearchDocument(filePath: string): Promise<SearchDocument | null> {
  const normalizedPath = normalizePath(filePath);
  const type = inferTypeFromPath(normalizedPath);
  if (!type) {
    return null;
  }

  if (type === "artist") {
    const parsed = await readMarkdownFile(filePath, artistSchema);
    return {
      id: normalizedPath,
      type,
      slug: parsed.data.slug,
      title: parsed.data.title,
      tags: parsed.data.tags,
      path: normalizedPath,
      content: parsed.content
    };
  }
  if (type === "project") {
    const parsed = await readMarkdownFile(filePath, projectSchema);
    return {
      id: normalizedPath,
      type,
      slug: parsed.data.slug,
      title: parsed.data.title,
      tags: parsed.data.tags,
      path: normalizedPath,
      content: parsed.content
    };
  }
  if (type === "track") {
    const parsed = await readMarkdownFile(filePath, trackSchema);
    return {
      id: normalizedPath,
      type,
      slug: parsed.data.slug,
      title: parsed.data.title,
      tags: parsed.data.tags,
      path: normalizedPath,
      content: [parsed.content, parsed.data.lyrics, parsed.data.notes].filter(Boolean).join("\n")
    };
  }

  const parsed = await readMarkdownFile(filePath, fragmentSchema);
  return {
    id: normalizedPath,
    type: "fragment",
    slug: parsed.data.slug,
    title: parsed.data.title,
    tags: parsed.data.tags,
    path: normalizedPath,
    content: [parsed.content, parsed.data.text].filter(Boolean).join("\n")
  };
}

function snippetFromContent(content: string, q: string): string {
  if (!content.trim()) {
    return "";
  }
  if (!q.trim()) {
    return content.slice(0, 180);
  }
  const index = content.toLowerCase().indexOf(q.toLowerCase());
  if (index < 0) {
    return content.slice(0, 180);
  }
  const start = Math.max(0, index - 70);
  const end = Math.min(content.length, index + q.length + 70);
  return content.slice(start, end);
}

function isUnderUserRoot(filePath: string, userSlug: string): boolean {
  return normalizePath(filePath).includes(`/users/${userSlug}/`);
}

export async function searchUserData(userSlug: string, query: SearchQuery): Promise<SearchResultItem[]> {
  const root = path.join(DATA_ROOT, "users", userSlug);
  const markdownFiles = await listMarkdownFilesRecursive(root);
  const documents = (
    await Promise.all(markdownFiles.filter((file) => isUnderUserRoot(file, userSlug)).map(fileToSearchDocument))
  ).filter((doc): doc is SearchDocument => doc !== null);

  const index = new MiniSearch<SearchDocument>({
    fields: ["title", "tags", "content"],
    storeFields: ["id", "type", "slug", "title", "tags", "path", "content"],
    searchOptions: { prefix: true, fuzzy: 0.15 }
  });

  index.addAll(documents);

  const miniResults = query.q.trim()
    ? index.search(query.q)
    : documents.map((doc) => ({ ...doc, score: 0, terms: [] as string[], queryTerms: [] as string[] }));

  const filtered = miniResults.filter((result) => {
    if (query.type && result.type !== query.type) {
      return false;
    }
    if (query.tags && query.tags.length > 0) {
      const normalizedTags = (result.tags as string[]).map((tag: string) => tag.toLowerCase());
      return query.tags.every((tag: string) => normalizedTags.includes(tag.toLowerCase()));
    }
    return true;
  });

  return filtered.map((result) => ({
    id: result.id,
    type: result.type,
    slug: result.slug,
    title: result.title,
    tags: result.tags,
    path: result.path,
    snippet: snippetFromContent(result.content ?? "", query.q),
    score: result.score
  }));
}
