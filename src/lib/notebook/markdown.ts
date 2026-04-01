import type { NotebookPageFrontmatter } from "@/lib/domain/models";

function toYamlString(value: string): string {
  return JSON.stringify(value);
}

export function buildNotebookMarkdown(metadata: NotebookPageFrontmatter, body: string): string {
  const normalizedBody = body.replace(/\r\n/g, "\n").replace(/^\n+/, "");

  return [
    "---",
    `name: ${toYamlString(metadata.name)}`,
    `description: ${toYamlString(metadata.description)}`,
    `page_type: ${toYamlString(metadata.pageType)}`,
    `created: ${toYamlString(metadata.created)}`,
    `last_modified: ${toYamlString(metadata.lastModified)}`,
    "---",
    "",
    normalizedBody
  ].join("\n");
}

export function extractNotebookBody(rawContent: string): string {
  const normalized = rawContent.replace(/\r\n/g, "\n");

  if (!normalized.startsWith("---\n")) {
    return normalized;
  }

  const closingIndex = normalized.indexOf("\n---\n", 4);
  if (closingIndex < 0) {
    return normalized;
  }

  return normalized.slice(closingIndex + 5);
}
