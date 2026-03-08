import {
  DeleteObjectCommand,
  GetObjectCommand,
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
      contentType: response.ContentType ?? null
    };
  } catch (error) {
    if (isNotFoundError(error)) {
      return null;
    }
    throw error;
  }
}

export async function listObjectKeys(prefix: string): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;

  do {
    const response = await getClient().send(
      new ListObjectsV2Command({
        Bucket: getBucketName(),
        Prefix: prefix,
        ContinuationToken: continuationToken
      })
    );
    for (const item of response.Contents ?? []) {
      if (item.Key) {
        keys.push(item.Key);
      }
    }
    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined;
  } while (continuationToken);

  return keys;
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

export async function deleteObject(path: string): Promise<void> {
  await getClient().send(
    new DeleteObjectCommand({
      Bucket: getBucketName(),
      Key: path
    })
  );
}
