import { Button } from "@/components/ui/button";
import type { MapLayer } from "@/types/app";
import { Crosshair, Layers, Minus, Plus } from "lucide-react";

interface MapControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onLocate: () => void;
  layers: Record<MapLayer, boolean>;
  onToggleLayer: (layer: MapLayer) => void;
  locating: boolean;
}

const LAYER_LABELS: Record<MapLayer, string> = {
  route: "Route line",
  tags: "Tags",
  signals: "Signals",
};

/**
 * Floating map controls: zoom stack, locate button, and a layer toggle popover.
 */
export function MapControls({
  onZoomIn,
  onZoomOut,
  onLocate,
  layers,
  onToggleLayer,
  locating,
}: MapControlsProps) {
  return (
    <div className="pointer-events-none absolute right-3 top-24 z-30 flex flex-col items-end gap-2 sm:right-4 sm:top-28">
      <div className="pointer-events-auto flex flex-col overflow-hidden rounded-xl surface-glass shadow-panel">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="map.zoom_in_button"
          aria-label="Zoom in"
          onClick={onZoomIn}
          className="size-11 rounded-none text-foreground hover:bg-accent/20"
        >
          <Plus className="size-5" aria-hidden="true" />
        </Button>
        <span className="h-px w-full bg-border/70" aria-hidden="true" />
        <Button
          type="button"
          variant="ghost"
          size="icon"
          data-ocid="map.zoom_out_button"
          aria-label="Zoom out"
          onClick={onZoomOut}
          className="size-11 rounded-none text-foreground hover:bg-accent/20"
        >
          <Minus className="size-5" aria-hidden="true" />
        </Button>
      </div>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        data-ocid="map.locate_button"
        aria-label="Centre on my location"
        onClick={onLocate}
        className="pointer-events-auto size-11 rounded-xl surface-glass text-primary shadow-panel hover:bg-accent/20"
      >
        <Crosshair
          className={`size-5 ${locating ? "animate-spin" : ""}`}
          aria-hidden="true"
        />
      </Button>

      <div className="pointer-events-auto flex flex-col gap-1 rounded-xl surface-glass p-1.5 shadow-panel">
        <span className="flex items-center gap-1 px-1.5 pt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          <Layers className="size-3" aria-hidden="true" />
          Layers
        </span>
        {(Object.keys(LAYER_LABELS) as MapLayer[]).map((layer) => (
          <button
            key={layer}
            type="button"
            data-ocid={`map.layer_toggle.${layer}`}
            aria-pressed={layers[layer]}
            onClick={() => onToggleLayer(layer)}
            className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
              layers[layer]
                ? "bg-primary/15 text-primary"
                : "text-muted-foreground hover:bg-accent/15 hover:text-foreground"
            }`}
          >
            <span
              className={`size-2 rounded-full ${
                layers[layer] ? "bg-primary" : "bg-muted-foreground/50"
              }`}
              aria-hidden="true"
            />
            {LAYER_LABELS[layer]}
          </button>
        ))}
      </div>
    </div>
  );
}
