import { NextResponse } from "next/server";

export function ok<T>(payload: T, status = 200): NextResponse {
  return NextResponse.json(payload, { status });
}

export function deleted(existed: boolean): NextResponse {
  return NextResponse.json({ deleted: existed }, { status: existed ? 200 : 404 });
}

