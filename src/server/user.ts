import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { env } from "cloudflare:workers";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/d1";

import * as schema from "#/db/schema.ts";
import { userIdentities, users } from "#/db/schema.ts";

export const getCurrentUserId = async () => {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) {
    return null;
  }

  const db = drizzle(env.DB, { schema });
  const [identity] = await db
    .select({ userId: userIdentities.userId })
    .from(userIdentities)
    .where(eq(userIdentities.clerkUserId, clerkUserId))
    .limit(1);
  if (identity) {
    return identity.userId;
  }

  const user = await clerkClient().users.getUser(clerkUserId);
  const email =
    user.primaryEmailAddress?.emailAddress ??
    user.emailAddresses[0]?.emailAddress ??
    `${clerkUserId}@unknown.local`;

  // 同じメールアドレスの行があれば Clerk のインスタンスが違っても同じユーザーとして扱う
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  let userId = clerkUserId;
  if (existing) {
    userId = existing.id;
  } else {
    const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || null;
    await db
      .insert(users)
      .values({ displayName, email, id: clerkUserId, imageUrl: user.imageUrl || null })
      .onConflictDoNothing();
  }

  await db.insert(userIdentities).values({ clerkUserId, userId }).onConflictDoNothing();
  return userId;
};
