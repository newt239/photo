import { clerkMiddleware } from "@clerk/tanstack-react-start/server";
import { createCsrfMiddleware, createStart } from "@tanstack/react-start";

export const startInstance = createStart(() => ({
  requestMiddleware: [
    createCsrfMiddleware({ filter: (ctx) => ctx.handlerType === "serverFn" }),
    clerkMiddleware(),
  ],
}));
