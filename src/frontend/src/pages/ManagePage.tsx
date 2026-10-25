import { ManageRoutesTab } from "@/components/manage/ManageRoutesTab";
import { ManageTagsTab } from "@/components/manage/ManageTagsTab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRoutes, useTags } from "@/hooks/use-backend";
import { APP_NAME } from "@/lib/constants";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, Route as RouteIcon, Tag as TagIcon } from "lucide-react";

/**
 * Management panel: a single screen with tabs for saved routes and for
 * tags/notes. Reuses the shared backend hooks and the map shell's design
 * tokens so it reads as part of the same cockpit.
 */
export function ManagePage() {
  const { data: routes = [] } = useRoutes();
  const { data: tags = [] } = useTags();

  return (
    <div data-ocid="manage.page" className="min-h-[100dvh] bg-background pb-16">
      <header className="sticky top-0 z-20 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-3xl items-center gap-3 px-4 py-4 sm:px-6">
          <Link
            to="/"
            data-ocid="manage.back_link"
            aria-label="Back to map"
            className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-semibold text-foreground">
              Manage
            </h1>
            <p className="truncate text-xs text-muted-foreground">
              {APP_NAME} · routes, tags &amp; notes
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="routes" data-ocid="manage.tabs">
          <TabsList
            data-ocid="manage.tabs.list"
            className="mb-6 grid h-11 w-full grid-cols-2 rounded-xl bg-muted p-1"
          >
            <TabsTrigger
              value="routes"
              data-ocid="manage.routes.tab"
              className="gap-2 text-sm"
            >
              <RouteIcon className="size-4" aria-hidden="true" />
              Routes
              <span className="telemetry rounded-md bg-background/60 px-1.5 text-[11px] text-muted-foreground">
                {routes.length}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="tags"
              data-ocid="manage.tags.tab"
              className="gap-2 text-sm"
            >
              <TagIcon className="size-4" aria-hidden="true" />
              Tags &amp; notes
              <span className="telemetry rounded-md bg-background/60 px-1.5 text-[11px] text-muted-foreground">
                {tags.length}
              </span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="routes" data-ocid="manage.routes.panel">
            <ManageRoutesTab />
          </TabsContent>

          <TabsContent value="tags" data-ocid="manage.tags.panel">
            <ManageTagsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
