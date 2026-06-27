import { ApiError } from "@/lib/api/errors";
import { getCloudflareBindings, type D1Value } from "@/lib/cloudflare/bindings";

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

function toD1Params(params: unknown[]): D1Value[] {
  return params.map((value) => {
    if (
      value === null ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean" ||
      value instanceof ArrayBuffer ||
      value instanceof Uint8Array
    ) {
      return value;
    }
    throw new ApiError(500, "INTERNAL_ERROR", "Unsupported Cloudflare D1 query parameter.");
  });
}

function returnsRows(sql: string): boolean {
  const trimmed = sql.trimStart().toLowerCase();
  return trimmed.startsWith("select") || trimmed.startsWith("pragma") || trimmed.startsWith("with");
}

function shouldUseD1Binding(): boolean {
  const mode = process.env.CLOUDFLARE_D1_BINDING_MODE?.trim().toLowerCase();
  if (mode === "always" || mode === "binding") {
    return true;
  }
  if (mode === "never" || mode === "remote" || mode === "rest") {
    return false;
  }

  return process.env.NODE_ENV === "production";
}

async function queryD1Binding<T>(sql: string, params: unknown[]): Promise<T[] | null> {
  if (!shouldUseD1Binding()) {
    return null;
  }

  const database = getCloudflareBindings()?.songwriting_dashboard;
  if (!database) {
    return null;
  }

  const statement = database.prepare(sql).bind(...toD1Params(params));
  const result = returnsRows(sql) ? await statement.all<T>() : await statement.run<T>();
  if (!result.success) {
    throw new ApiError(502, "INTERNAL_ERROR", result.error ?? "Cloudflare D1 query failed.");
  }

  return result.results ?? [];
}

export async function queryD1<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const bindingRows = await queryD1Binding<T>(sql, params);
  if (bindingRows) {
    return bindingRows;
  }

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
