import { badRequest, notFound } from "@/lib/api/errors";
import { queryD1 } from "@/lib/cloudflare/d1";

const USER_SLUG_TO_NAME: Record<string, string> = {
  dan: "Dan"
};

interface UserRow {
  id: number;
}

function resolveUserName(userSlug: string): string {
  const normalized = userSlug.trim().toLowerCase();
  const userName = USER_SLUG_TO_NAME[normalized];
  if (!userName) {
    throw badRequest(`Unsupported user slug: ${userSlug}`);
  }
  return userName;
}

export async function resolveUserId(userSlug: string): Promise<number> {
  const userName = resolveUserName(userSlug);
  const rows = await queryD1<UserRow>("SELECT id FROM users WHERE name = ? LIMIT 1;", [userName]);
  const userId = rows[0]?.id;
  if (!userId) {
    throw notFound(`User not found in D1: ${userName}`);
  }
  return userId;
}
