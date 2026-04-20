import {
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { ApiError } from "@/lib/api/errors";

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

function normalizeEtag(value: string | undefined): string | null {
  if (!value) {
    return null;
  }
  return value.replace(/^"+|"+$/g, "");
}

function isNotFoundError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const maybeError = error as { name?: string; $metadata?: { httpStatusCode?: number } };
  return maybeError.name === "NoSuchKey" || maybeError.$metadata?.httpStatusCode === 404;
}

export async function getMarkdownObject(path: string): Promise<{ content: string; etag: string | null } | null> {
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

export async function listObjectKeys(prefix: string): Promise<string[]> {
  const summaries = await listObjectSummaries({ prefix, limit: 1000 });
  return summaries.map((item) => item.key);
}

export async function putMarkdownObject(path: string, content: string): Promise<{ etag: string | null }> {
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
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: path
    })
  );
}
