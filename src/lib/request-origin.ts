import { headers } from "next/headers";

function firstHeaderValue(value: string | null): string | null {
  if (!value) {
    return null;
  }

  const [firstValue] = value.split(",");
  return firstValue?.trim() ?? null;
}

export async function getRequestOrigin(): Promise<string> {
  const requestHeaders = await headers();
  const host =
    firstHeaderValue(requestHeaders.get("x-forwarded-host")) ??
    firstHeaderValue(requestHeaders.get("host"));

  if (!host) {
    throw new Error("Unable to determine request host for image URLs.");
  }

  const protocol =
    firstHeaderValue(requestHeaders.get("x-forwarded-proto")) ??
    (host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https");

  return `${protocol}://${host}`;
}
