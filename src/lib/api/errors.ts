import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  public readonly status: number;
  public readonly code: ApiErrorCode;
  public readonly details?: unknown;

  constructor(status: number, code: ApiErrorCode, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function badRequest(message: string, details?: unknown): ApiError {
  return new ApiError(400, "BAD_REQUEST", message, details);
}

export function notFound(message: string, details?: unknown): ApiError {
  return new ApiError(404, "NOT_FOUND", message, details);
}

export function conflict(message: string, details?: unknown): ApiError {
  return new ApiError(409, "CONFLICT", message, details);
}

function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }
  if (error instanceof ZodError) {
    return new ApiError(400, "VALIDATION_ERROR", "Payload validation failed.", error.flatten());
  }
  if (error instanceof Error && "code" in error && error.code === "ENOENT") {
    return notFound("Requested resource does not exist.");
  }
  if (error instanceof Error) {
    return new ApiError(500, "INTERNAL_ERROR", error.message);
  }
  return new ApiError(500, "INTERNAL_ERROR", "Unexpected server error.");
}

export function apiErrorResponse(error: unknown): NextResponse {
  const normalized = toApiError(error);
  return NextResponse.json(
    {
      error: {
        code: normalized.code,
        message: normalized.message,
        details: normalized.details
      }
    },
    { status: normalized.status }
  );
}

