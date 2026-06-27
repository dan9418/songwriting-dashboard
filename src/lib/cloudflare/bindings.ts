import { getCloudflareContext } from "@opennextjs/cloudflare";

export type D1Value = ArrayBuffer | boolean | null | number | string | Uint8Array;

export interface D1Result<T> {
  success: boolean;
  results?: T[];
  error?: string;
}

export interface D1PreparedStatement {
  bind(...values: D1Value[]): D1PreparedStatement;
  all<T = unknown>(): Promise<D1Result<T>>;
  run<T = unknown>(): Promise<D1Result<T>>;
}

export interface D1DatabaseBinding {
  prepare(sql: string): D1PreparedStatement;
}

export interface R2Range {
  offset?: number;
  length?: number;
  suffix?: number;
}

export interface R2HttpMetadata {
  contentType?: string;
}

export interface R2Object {
  key: string;
  size: number;
  etag: string;
  httpEtag?: string;
  uploaded: Date;
  httpMetadata?: R2HttpMetadata;
  range?: R2Range;
  storageClass?: string;
}

export interface R2ObjectBody extends R2Object {
  body: ReadableStream<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
}

export interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

export interface R2BucketBinding {
  head(key: string): Promise<R2Object | null>;
  get(key: string, options?: { range?: R2Range }): Promise<R2ObjectBody | null>;
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Blob | ReadableStream | string | null,
    options?: { httpMetadata?: R2HttpMetadata }
  ): Promise<R2Object | null>;
  delete(key: string | string[]): Promise<void>;
  list(options?: { cursor?: string; limit?: number; prefix?: string }): Promise<R2Objects>;
}

interface CloudflareBindings {
  songwriting_dashboard?: D1DatabaseBinding;
  songwriting_media?: R2BucketBinding;
}

export function getCloudflareBindings(): CloudflareBindings | null {
  try {
    return getCloudflareContext().env as CloudflareBindings;
  } catch {
    return null;
  }
}

export function shouldUseCloudflareBindings(): boolean {
  const mode = process.env.CLOUDFLARE_BINDING_MODE?.trim().toLowerCase();
  if (mode === "always" || mode === "binding" || mode === "bindings") {
    return true;
  }
  if (mode === "never" || mode === "remote" || mode === "rest") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}
