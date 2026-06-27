import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { ApiError } from "@/lib/api/errors";
import {
  getCloudflareBindings,
  type R2BucketBinding,
  type R2Object,
  type R2ObjectBody,
  type R2Range
} from "@/lib/cloudflare/bindings";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(500, "INTERNAL_ERROR", `Missing required environment variable: ${name}`);
  }
  return value;
}

function getClient(): S3Client {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const accessKeyId = getRequiredEnv("CLOUDFLARE_R2_ACCESS_KEY_ID");
  const secretAccessKey = getRequiredEnv("CLOUDFLARE_R2_SECRET_ACCESS_KEY");

  return new S3Client({
    region: "auto",
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey }
  });
}

function getBucketName(): string {
  return process.env.CLOUDFLARE_R2_BUCKET ?? "songwriting-media";
}

function getBoundBucket(bucketName?: string): R2BucketBinding | null {
  const defaultBucketName = getBucketName();
  if (bucketName && bucketName !== defaultBucketName) {
    return null;
  }
  return getCloudflareBindings()?.songwriting_media ?? null;
}

function normalizeEtag(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, "");
}

function r2ObjectEtag(object: R2Object): string | null {
  return normalizeEtag(object.httpEtag ?? object.etag);
}

function r2ObjectContentType(object: R2Object): string | null {
  return object.httpMetadata?.contentType ?? null;
}

function r2ObjectLastModified(object: R2Object): string | null {
  return object.uploaded ? object.uploaded.toISOString() : null;
}

function toObjectSummary(object: R2Object): R2ObjectSummary {
  return {
    key: object.key,
    size: object.size,
    etag: r2ObjectEtag(object),
    lastModified: r2ObjectLastModified(object),
    storageClass: object.storageClass ?? null
  };
}

function parseRangeHeader(range: string): R2Range | null {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(range.trim());
  if (!match) {
    return null;
  }

  const [, start, end] = match;
  if (!start && !end) {
    return null;
  }
  if (!start) {
    const suffix = Number(end);
    return Number.isSafeInteger(suffix) && suffix > 0 ? { suffix } : null;
  }

  const offset = Number(start);
  if (!Number.isSafeInteger(offset) || offset < 0) {
    return null;
  }
  if (!end) {
    return { offset };
  }

  const endOffset = Number(end);
  if (!Number.isSafeInteger(endOffset) || endOffset < offset) {
    return null;
  }

  return {
    offset,
    length: endOffset - offset + 1
  };
}

function objectContentLength(object: R2ObjectBody): number {
  return object.range?.length ?? object.range?.suffix ?? object.size;
}

function objectContentRange(object: R2ObjectBody): string | null {
  if (!object.range) {
    return null;
  }

  const length = objectContentLength(object);
  const start =
    typeof object.range.offset === "number"
      ? object.range.offset
      : Math.max(0, object.size - length);
  const end = start + length - 1;
  return `bytes ${start}-${end}/${object.size}`;
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return maybeError.name === "NoSuchKey" || maybeError.$metadata?.httpStatusCode === 404;
}

export async function getMarkdownObject(path: string): Promise<{ content: string; etag: string | null } | null> {
  const bucket = getBoundBucket();
  if (bucket) {
    const object = await bucket.get(path);
    if (!object) {
      return null;
    }
    return {
      content: await object.text(),
      etag: r2ObjectEtag(object)
    };
  }

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: path
      })
    );
    const content = response.Body ? await response.Body.transformToString() : "";
    return {
      content,
      etag: normalizeEtag(response.ETag)
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getObjectData(path: string): Promise<{
  body: Uint8Array;
  etag: string | null;
  contentType: string | null;
  contentLength: number | null;
  contentRange: string | null;
  acceptRanges: string | null;
} | null> {
  const bucket = getBoundBucket();
  if (bucket) {
    const object = await bucket.get(path);
    if (!object) {
      return null;
    }
    return {
      body: new Uint8Array(await object.arrayBuffer()),
      etag: r2ObjectEtag(object),
      contentType: r2ObjectContentType(object),
      contentLength: objectContentLength(object),
      contentRange: objectContentRange(object),
      acceptRanges: "bytes"
    };
  }

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: path
      })
    );
    const body = response.Body ? await response.Body.transformToByteArray() : new Uint8Array();
    return {
      body,
      etag: normalizeEtag(response.ETag),
      contentType: response.ContentType ?? null,
      contentLength: typeof response.ContentLength === "number" ? response.ContentLength : null,
      contentRange: response.ContentRange ?? null,
      acceptRanges: response.AcceptRanges ?? null
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getBucketObjectData(
  bucketName: string,
  path: string
): Promise<{
  body: Uint8Array;
  etag: string | null;
  contentType: string | null;
  contentLength: number | null;
  contentRange: string | null;
  acceptRanges: string | null;
} | null> {
  const bucket = getBoundBucket(bucketName);
  if (bucket) {
    const object = await bucket.get(path);
    if (!object) {
      return null;
    }
    return {
      body: new Uint8Array(await object.arrayBuffer()),
      etag: r2ObjectEtag(object),
      contentType: r2ObjectContentType(object),
      contentLength: objectContentLength(object),
      contentRange: objectContentRange(object),
      acceptRanges: "bytes"
    };
  }

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: path
      })
    );
    const body = response.Body ? await response.Body.transformToByteArray() : new Uint8Array();
    return {
      body,
      etag: normalizeEtag(response.ETag),
      contentType: response.ContentType ?? null,
      contentLength: typeof response.ContentLength === "number" ? response.ContentLength : null,
      contentRange: response.ContentRange ?? null,
      acceptRanges: response.AcceptRanges ?? null
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getBucketObjectStream(
  bucketName: string,
  path: string
): Promise<{
  body: ReadableStream<Uint8Array>;
  etag: string | null;
  contentType: string | null;
  contentLength: number | null;
} | null> {
  const bucket = getBoundBucket(bucketName);
  if (bucket) {
    const object = await bucket.get(path);
    if (!object) {
      return null;
    }
    return {
      body: object.body,
      etag: r2ObjectEtag(object),
      contentType: r2ObjectContentType(object),
      contentLength: objectContentLength(object)
    };
  }

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: bucketName,
        Key: path
      })
    );
    const body = response.Body as unknown as {
      transformToWebStream?: () => ReadableStream<Uint8Array>;
      transformToByteArray?: () => Promise<Uint8Array>;
    } | undefined;
    const stream = body?.transformToWebStream
      ? body.transformToWebStream()
      : new ReadableStream<Uint8Array>({
          async start(controller) {
            const bytes = body?.transformToByteArray ? await body.transformToByteArray() : new Uint8Array();
            controller.enqueue(bytes);
            controller.close();
          }
        });

    return {
      body: stream,
      etag: normalizeEtag(response.ETag),
      contentType: response.ContentType ?? null,
      contentLength: typeof response.ContentLength === "number" ? response.ContentLength : null
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function getObjectDataRange(
  path: string,
  range: string
): Promise<{
  body: Uint8Array;
  etag: string | null;
  contentType: string | null;
  contentLength: number | null;
  contentRange: string | null;
  acceptRanges: string | null;
} | null> {
  const bucket = getBoundBucket();
  const parsedRange = parseRangeHeader(range);
  if (bucket && parsedRange) {
    const object = await bucket.get(path, { range: parsedRange });
    if (!object) {
      return null;
    }
    return {
      body: new Uint8Array(await object.arrayBuffer()),
      etag: r2ObjectEtag(object),
      contentType: r2ObjectContentType(object),
      contentLength: objectContentLength(object),
      contentRange: objectContentRange(object),
      acceptRanges: "bytes"
    };
  }

  try {
    const response = await getClient().send(
      new GetObjectCommand({
        Bucket: getBucketName(),
        Key: path,
        Range: range
      })
    );
    const body = response.Body ? await response.Body.transformToByteArray() : new Uint8Array();
    return {
      body,
      etag: normalizeEtag(response.ETag),
      contentType: response.ContentType ?? null,
      contentLength: typeof response.ContentLength === "number" ? response.ContentLength : null,
      contentRange: response.ContentRange ?? null,
      acceptRanges: response.AcceptRanges ?? null
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export interface R2ObjectSummary {
  key: string;
  size: number;
  etag: string | null;
  lastModified: string | null;
  storageClass: string | null;
}

export async function listObjectSummaries({
  bucketName,
  prefix = "",
  limit = 200
}: {
  bucketName?: string;
  prefix?: string;
  limit?: number;
}): Promise<R2ObjectSummary[]> {
  const bucket = getBoundBucket(bucketName);
  if (bucket) {
    const summaries: R2ObjectSummary[] = [];
    let cursor: string | undefined;
    const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 200;

    do {
      const remaining = safeLimit - summaries.length;
      if (remaining <= 0) {
        break;
      }

      const response = await bucket.list({
        prefix,
        cursor,
        limit: Math.min(remaining, 1000)
      });
      summaries.push(...response.objects.map(toObjectSummary));
      cursor = response.truncated ? response.cursor : undefined;
    } while (cursor);

    return summaries;
  }

  const summaries: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;
  const safeLimit = Number.isFinite(limit) ? Math.max(1, Math.min(1000, Math.floor(limit))) : 200;

  do {
    const remaining = safeLimit - summaries.length;
    if (remaining <= 0) {
      break;
    }

    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucketName ?? getBucketName(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: Math.min(remaining, 1000)
      })
    );

    for (const item of response.Contents ?? []) {
      if (!item.Key) {
        continue;
      }
      summaries.push({
        key: item.Key,
        size: item.Size ?? 0,
        etag: normalizeEtag(item.ETag),
        lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        storageClass: item.StorageClass ?? null
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return summaries;
}

export async function listAllObjectSummaries({
  bucketName,
  prefix = ""
}: {
  bucketName?: string;
  prefix?: string;
}): Promise<R2ObjectSummary[]> {
  const bucket = getBoundBucket(bucketName);
  if (bucket) {
    const summaries: R2ObjectSummary[] = [];
    let cursor: string | undefined;

    do {
      const response = await bucket.list({
        prefix,
        cursor,
        limit: 1000
      });
      summaries.push(...response.objects.map(toObjectSummary));
      cursor = response.truncated ? response.cursor : undefined;
    } while (cursor);

    return summaries;
  }

  const summaries: R2ObjectSummary[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: bucketName ?? getBucketName(),
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
    );

    for (const item of response.Contents ?? []) {
      if (!item.Key) {
        continue;
      }
      summaries.push({
        key: item.Key,
        size: item.Size ?? 0,
        etag: normalizeEtag(item.ETag),
        lastModified: item.LastModified ? item.LastModified.toISOString() : null,
        storageClass: item.StorageClass ?? null
      });
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return summaries;
}

export async function listObjectKeys(prefix: string): Promise<string[]> {
  const summaries = await listObjectSummaries({ prefix, limit: 1000 });
  return summaries.map((item) => item.key);
}

export async function putMarkdownObject(path: string, content: string): Promise<{ etag: string | null }> {
  const bucket = getBoundBucket();
  if (bucket) {
    const object = await bucket.put(path, content, {
      httpMetadata: { contentType: "text/markdown; charset=utf-8" }
    });
    return {
      etag: object ? r2ObjectEtag(object) : null
    };
  }

  const response = await getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: path,
      Body: content,
      ContentType: "text/markdown; charset=utf-8"
    })
  );

  return {
    etag: normalizeEtag(response.ETag)
  };
}

export async function putObjectData(
  path: string,
  body: Uint8Array,
  contentType?: string | null
): Promise<{ etag: string | null }> {
  const bucket = getBoundBucket();
  if (bucket) {
    const object = await bucket.put(path, body, {
      httpMetadata: { contentType: contentType ?? "application/octet-stream" }
    });
    return {
      etag: object ? r2ObjectEtag(object) : null
    };
  }

  const response = await getClient().send(
    new PutObjectCommand({
      Bucket: getBucketName(),
      Key: path,
      Body: body,
      ContentType: contentType ?? "application/octet-stream"
    })
  );

  return {
    etag: normalizeEtag(response.ETag)
  };
}

export async function objectExists(path: string): Promise<boolean> {
  const bucket = getBoundBucket();
  if (bucket) {
    return (await bucket.head(path)) !== null;
  }

  try {
    await getClient().send(
      new HeadObjectCommand({
        Bucket: getBucketName(),
        Key: path
      })
    );
    return true;
  } catch (error) {
    if (isNotFoundError(error)) {
      return false;
    }
    throw error;
  }
}

export async function deleteObject(path: string): Promise<void> {
  const bucket = getBoundBucket();
  if (bucket) {
    await bucket.delete(path);
    return;
  }

  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: path
    })
  );
}
