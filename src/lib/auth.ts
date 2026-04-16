import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";

import { getDb } from "#/db/index.ts";
import { users } from "#/db/schema.ts";

export const requireUserId = async (): Promise<string> => {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("UNAUTHORIZED");
  }
  return userId;
};

export const ensureUserRow = async (userId: string): Promise<void> => {
  const db = getDb(env.DB);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (existing.length > 0) {
    return;
  }

  const user = await clerkClient().users.getUser(userId);
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${userId}@unknown.local`;
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
  const imageUrl = user.imageUrl || null;

  await db.insert(users).values({ displayName, email, id: userId, imageUrl }).onConflictDoNothing();
};
