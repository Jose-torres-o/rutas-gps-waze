import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import {
  CircleDot,
  Route as RouteIcon,
  Share2,
  SlidersHorizontal,
  Square,
  Tag as TagIcon,
} from "lucide-react";

export type DockPanel = "routes" | "tags" | "share" | null;

interface BottomDockProps {
  recording: boolean;
  activePanel: DockPanel;
  onToggleRecord: () => void;
  onOpenPanel: (panel: Exclude<DockPanel, null>) => void;
  recordDisabled: boolean;
}

interface DockAction {
  key: Exclude<DockPanel, null>;
  label: string;
  icon: typeof RouteIcon;
  ocid: string;
}

const ACTIONS: DockAction[] = [
  {
    key: "routes",
    label: "Routes",
    icon: RouteIcon,
    ocid: "dock.routes_button",
  },
  { key: "tags", label: "Tags", icon: TagIcon, ocid: "dock.tags_button" },
  { key: "share", label: "Share", icon: Share2, ocid: "dock.share_button" },
];

/**
 * Bottom action dock: a prominent record toggle flanked by panel actions.
 */
export function BottomDock({
  recording,
  activePanel,
  onToggleRecord,
  onOpenPanel,
  recordDisabled,
}: BottomDockProps) {
  const left = ACTIONS.slice(0, 2);
  const right = ACTIONS.slice(2);

  const renderAction = (action: DockAction) => {
    const Icon = action.icon;
    const active = activePanel === action.key;
    return (
      <button
        key={action.key}
        type="button"
        data-ocid={action.ocid}
        aria-pressed={active}
        onClick={() => onOpenPanel(action.key)}
        className={`flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium transition-colors ${
          active
            ? "bg-primary/15 text-primary"
            : "text-muted-foreground hover:bg-accent/15 hover:text-foreground"
        }`}
      >
        <Icon className="size-5" aria-hidden="true" />
        {action.label}
      </button>
    );
  };

  return (
    <nav
      data-ocid="dock.panel"
      aria-label="Map actions"
      className="pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex items-center justify-between gap-2 rounded-2xl surface-glass px-2 py-2 shadow-dock sm:inset-x-4 sm:bottom-4 sm:px-3"
    >
      <div className="flex items-center gap-1">{left.map(renderAction)}</div>

      <Button
        type="button"
        data-ocid="dock.record_button"
        aria-label={
          recording ? "Stop recording route" : "Start recording route"
        }
        aria-pressed={recording}
        disabled={recordDisabled}
        onClick={onToggleRecord}
        className={`size-16 shrink-0 rounded-full border-4 border-primary/30 shadow-panel transition-transform hover:scale-105 ${
          recording
            ? "bg-destructive text-destructive-foreground"
            : "bg-primary text-primary-foreground"
        }`}
      >
        {recording ? (
          <Square className="size-6" fill="currentColor" aria-hidden="true" />
        ) : (
          <CircleDot className="size-7" aria-hidden="true" />
        )}
      </Button>

      <div className="flex items-center gap-1">
        {right.map(renderAction)}
        <Link
          to="/manage"
          data-ocid="dock.manage_link"
          aria-label="Open management panel"
          className="flex min-w-[64px] flex-col items-center gap-1 rounded-xl px-3 py-2 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground"
        >
          <SlidersHorizontal className="size-5" aria-hidden="true" />
          Manage
        </Link>
      </div>
    </nav>
  );
}
