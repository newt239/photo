import { auth } from "@clerk/tanstack-react-start/server";
import { createServerFn } from "@tanstack/react-start";

export const fetchAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { userId, sessionId } = await auth();
  return { sessionId, userId };
});
