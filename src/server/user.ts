import { clerkClient } from "@clerk/tanstack-react-start/server";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { users } from "#/db/schema.ts";

export const ensureUserRow = async (userId: string) => {
  const db = drizzle(env.DB, { schema });
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
