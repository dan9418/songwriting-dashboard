import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import { z, type ZodTypeAny } from "zod";

export interface MarkdownEntity<T> {
  data: T;
  content: string;
}

export async function readMarkdownFile<TSchema extends ZodTypeAny>(
  filePath: string,
  schema: TSchema
): Promise<MarkdownEntity<z.infer<TSchema>>> {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = matter(raw);
  const validatedData = schema.parse(parsed.data);
  return {
    data: validatedData,
    content: parsed.content.trim()
  };
}

export async function writeMarkdownFile<T>(
  filePath: string,
  data: T,
  content = ""
): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  const output = matter.stringify(content.trim() ? `${content.trim()}\n` : "", data as object, {
    language: "yaml",
    //lineWidth: 120
  });
  await fs.writeFile(filePath, output, "utf-8");
}
