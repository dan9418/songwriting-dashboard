import { ApiError } from "@/lib/api/errors";

interface D1Error {
  message?: string;
}

interface D1QueryResult<T> {
  success: boolean;
  results?: T[];
  error?: string;
}

interface D1Response<T> {
  success: boolean;
  errors?: D1Error[];
  result?: D1QueryResult<T>[];
}

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new ApiError(500, "INTERNAL_ERROR", `Missing required environment variable: ${name}`);
  }
  return value;
}

function toD1Error(payload: D1Response<unknown>): string {
  const message = payload.errors?.map((error) => error.message).find(Boolean);
  return message ?? "Cloudflare D1 query failed.";
}

export async function queryD1<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const accountId = getRequiredEnv("CLOUDFLARE_ACCOUNT_ID");
  const databaseId = getRequiredEnv("CLOUDFLARE_D1_DATABASE_ID");
  const apiToken = getRequiredEnv("CLOUDFLARE_API_TOKEN");

  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`,
    {
      method: "POST",
      headers: {
        authorization: `Bearer ${apiToken}`,
        "content-type": "application/json"
      },
      body: JSON.stringify({ sql, params }),
      cache: "no-store"
    }
  );

  const payload = (await response.json().catch(() => null)) as D1Response<T> | null;
  if (!response.ok || !payload?.success) {
    throw new ApiError(502, "INTERNAL_ERROR", payload ? toD1Error(payload) : "Cloudflare D1 request failed.");
  }

  const firstResult = payload.result?.[0];
  if (!firstResult?.success) {
    throw new ApiError(502, "INTERNAL_ERROR", firstResult?.error ?? "Cloudflare D1 query was not successful.");
  }

  return firstResult.results ?? [];
}
