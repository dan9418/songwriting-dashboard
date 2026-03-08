import { apiErrorResponse, badRequest } from "@/lib/api/errors";
import { parseJsonBody } from "@/lib/api/request";
import { ok } from "@/lib/api/response";
import {
  createTrackDoc,
  deleteTrackDoc,
  getTrackDoc,
  parseTrackDocType,
  updateTrackDoc
} from "@/lib/cloudflare/track-docs";

export const runtime = "nodejs";

interface DocWriteBody {
  content?: string;
}

function getContentOrThrow(body: DocWriteBody): string {
  if (typeof body.content !== "string") {
    throw badRequest("Payload must include string content.");
  }
  return body.content;
}

export async function GET(
  _: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string; type: string }> }
) {
  try {
    const { userSlug, trackSlug, type } = await context.params;
    const record = await getTrackDoc(userSlug, trackSlug, parseTrackDocType(type));
    return ok(record);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string; type: string }> }
) {
  try {
    const { userSlug, trackSlug, type } = await context.params;
    const body = await parseJsonBody<DocWriteBody>(request);
    const content = typeof body.content === "string" ? body.content : "";
    const record = await createTrackDoc(userSlug, trackSlug, parseTrackDocType(type), content);
    return ok(record, 201);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string; type: string }> }
) {
  try {
    const { userSlug, trackSlug, type } = await context.params;
    const body = await parseJsonBody<DocWriteBody>(request);
    const record = await updateTrackDoc(
      userSlug,
      trackSlug,
      parseTrackDocType(type),
      getContentOrThrow(body)
    );
    return ok(record);
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(
  _: Request,
  context: { params: Promise<{ userSlug: string; trackSlug: string; type: string }> }
) {
  try {
    const { userSlug, trackSlug, type } = await context.params;
    const result = await deleteTrackDoc(userSlug, trackSlug, parseTrackDocType(type));
    return ok(result);
  } catch (error) {
    return apiErrorResponse(error);
  }
}
