import { badRequest } from "@/lib/api/errors";

export interface WriteMarkdownBody<T = unknown> {
  data: T;
  content?: string;
}

export async function parseJsonBody<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw badRequest("Request body must be valid JSON.");
  }
}

export function parseListQueryParam(searchParams: URLSearchParams, key: string): string[] {
  const repeated = searchParams.getAll(key).flatMap((item) => item.split(","));
  return repeated.map((item) => item.trim()).filter(Boolean);
}

export function assertSlugMatch(payloadSlug: unknown, expectedSlug: string): void {
  if (typeof payloadSlug === "string" && payloadSlug !== expectedSlug) {
    throw badRequest(`Payload slug (${payloadSlug}) does not match URL slug (${expectedSlug}).`);
  }
}
