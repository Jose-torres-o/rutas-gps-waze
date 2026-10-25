import { AppShell } from "@/components/layout/AppShell";
import { Toaster } from "@/components/ui/sonner";
import { ManagePage } from "@/pages/ManagePage";
import { RecordPage } from "@/pages/RecordPage";
import { RoutesPage } from "@/pages/RoutesPage";
import { SharePage } from "@/pages/SharePage";
import { TagsPage } from "@/pages/TagsPage";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
} from "@tanstack/react-router";

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <Toaster position="top-center" richColors />
    </>
  ),
});

const mapRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): { routeId?: string } => ({
    routeId: typeof search.routeId === "string" ? search.routeId : undefined,
  }),
  component: AppShell,
});

const shareRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/share",
  component: SharePage,
});

const manageRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/manage",
  component: ManagePage,
});

function RoutesRoute() {
  const navigate = useNavigate();
  return (
    <RoutesPage
      onBack={() => void navigate({ to: "/" })}
      onOpenOnMap={(route) =>
        void navigate({ to: "/", search: { routeId: route.id.toString() } })
      }
    />
  );
}

const routesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/routes",
  component: RoutesRoute,
});

const recordRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/record",
  component: RecordPage,
});

const tagsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tags",
  component: TagsPage,
});

const routeTree = rootRoute.addChildren([
  mapRoute,
  shareRoute,
  manageRoute,
  routesRoute,
  recordRoute,
  tagsRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
