import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { type RenderOptions, render } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";

/**
 * Render a component inside a fresh React Query client. Each call gets its own
 * client so cached queries never leak between tests. Retries are disabled so a
 * rejected mutation surfaces immediately rather than after backoff.
 */
export function renderWithQueryClient(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  }

  return {
    queryClient,
    ...render(ui, { wrapper: Wrapper, ...options }),
  };
}

/**
 * Render a component that uses TanStack Router primitives (`Link`, `useSearch`)
 * inside a real memory-history router, wrapped in a React Query client. The
 * component is mounted at `/` and any extra routes are registered so links to
 * them resolve.
 */
export function renderWithRouter(
  ui: ReactElement,
  options?: { initialPath?: string; extraPaths?: string[] },
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

  const rootRoute = createRootRoute();
  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    component: () => ui,
  });
  const extraRoutes = (options?.extraPaths ?? []).map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => null,
    }),
  );

  const router = createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...extraRoutes]),
    history: createMemoryHistory({
      initialEntries: [options?.initialPath ?? "/"],
    }),
  });

  return {
    queryClient,
    router,
    ...render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>,
    ),
  };
}
