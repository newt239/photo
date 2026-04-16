import { createRouter as createTanStackRouter } from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const router = createTanStackRouter({
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    routeTree,
    scrollRestoration: true,
  });

  return router;
};

declare module "@tanstack/react-router" {
  // eslint-disable-next-line typescript/consistent-type-definitions
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
