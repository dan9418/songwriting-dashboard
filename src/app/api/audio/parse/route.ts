import { NextResponse } from "next/server";
import { parseAudioFilename } from "@/lib/audio/filename";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fileName?: string };
    if (!body.fileName) {
      return NextResponse.json({ error: "fileName is required" }, { status: 400 });
    }

    const parsed = parseAudioFilename(body.fileName);
    return NextResponse.json({ valid: true, parsed }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to parse filename";
    return NextResponse.json({ valid: false, error: message }, { status: 400 });
  }
}

