import fs from "node:fs/promises";
import path from "node:path";

export async function pathExists(targetPath: string): Promise<boolean> {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function listDirectories(parentDir: string): Promise<string[]> {
  try {
    const entries = await fs.readdir(parentDir, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort((a, b) => a.localeCompare(b));
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
}

export async function removeFileIfExists(filePath: string): Promise<boolean> {
  try {
    await fs.unlink(filePath);
    return true;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

export async function listMarkdownFilesRecursive(rootDir: string): Promise<string[]> {
  const output: string[] = [];

  async function walk(dirPath: string) {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const nextPath = path.join(dirPath, entry.name);
      if (entry.isDirectory()) {
        await walk(nextPath);
      } else if (entry.isFile() && entry.name.endsWith(".md")) {
        output.push(nextPath);
      }
    }
  }

  try {
    await walk(rootDir);
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") {
      return [];
    }
    throw error;
  }
  return output.sort((a, b) => a.localeCompare(b));
}
