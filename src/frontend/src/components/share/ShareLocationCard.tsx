import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCoords } from "@/lib/format";
import { Check, Copy, Crosshair, Link2, MapPin } from "lucide-react";

interface ShareLocationCardProps {
  point: { lat: number; lng: number };
  label: string;
  onLabelChange: (value: string) => void;
  link: string;
  copied: boolean;
  onCopy: () => void;
  /** True while the point comes from a live GPS fix rather than the map centre. */
  live: boolean;
}

/**
 * The primary share surface: the exact point being shared, an optional label
 * that travels with the link, and the generated deep link with a copy action.
 */
export function ShareLocationCard({
  point,
  label,
  onLabelChange,
  link,
  copied,
  onCopy,
  live,
}: ShareLocationCardProps) {
  return (
    <section
      data-ocid="share.card"
      className="surface-glass flex flex-col gap-5 rounded-2xl p-5 shadow-panel"
    >
      <header className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
            Share this point
          </h2>
          <p className="text-sm text-muted-foreground">
            Anyone opening the link lands on the map centred here.
          </p>
        </div>
        <span
          data-ocid="share.source_badge"
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-wider ${
            live
              ? "border-primary/40 bg-primary/15 text-primary"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          <Crosshair className="size-3.5" aria-hidden="true" />
          {live ? "Live fix" : "Map centre"}
        </span>
      </header>

      <div className="flex items-center gap-3 rounded-xl border border-border bg-background/40 px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
          <MapPin className="size-4" aria-hidden="true" />
        </span>
        <div className="flex min-w-0 flex-col">
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            Coordinates
          </span>
          <span
            data-ocid="share.coords"
            className="telemetry truncate text-sm text-foreground"
          >
            {formatCoords(point.lat, point.lng)}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label
          htmlFor="share-page-label"
          className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
        >
          Label (optional)
        </label>
        <Input
          id="share-page-label"
          value={label}
          data-ocid="share.label_input"
          onChange={(event) => onLabelChange(event.target.value)}
          placeholder="e.g. Meeting point"
          maxLength={80}
        />
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Share link
        </span>
        <div className="flex items-center gap-2">
          <Input
            readOnly
            value={link}
            data-ocid="share.link_input"
            aria-label="Shareable location link"
            className="telemetry text-xs"
            onFocus={(event) => event.currentTarget.select()}
          />
          <Button
            type="button"
            size="icon"
            variant="outline"
            data-ocid="share.copy_button"
            aria-label="Copy location link"
            onClick={onCopy}
            className="shrink-0"
          >
            {copied ? (
              <Check className="size-4 text-success" aria-hidden="true" />
            ) : (
              <Copy className="size-4" aria-hidden="true" />
            )}
          </Button>
        </div>
        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
          The link carries the coordinates and label so the map opens in the
          right place.
        </p>
      </div>
    </section>
  );
}
