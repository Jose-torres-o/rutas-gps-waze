import { ShareChannels } from "@/components/share/ShareChannels";
import { ShareLocationCard } from "@/components/share/ShareLocationCard";
import { SharedLocationBanner } from "@/components/share/SharedLocationBanner";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useShareLocation } from "@/hooks/use-share-location";
import { APP_NAME, DEFAULT_CENTER } from "@/lib/constants";
import { parseLatLng } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import { ArrowLeft, Satellite } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

/**
 * Dedicated location-sharing page. Shares the live GPS fix when available,
 * otherwise the point from a shared link, otherwise the default map centre.
 */
export function SharePage() {
  const { fix, status } = useGeolocation({ watch: true });

  const [sharedPoint, setSharedPoint] = useState<LatLng | null>(null);
  const [sharedLabel, setSharedLabel] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [label, setLabel] = useState("");

  /* Read a shared link's coordinates and label on first load. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const point = parseLatLng(params.get("lat"), params.get("lng"));
    if (point) {
      setSharedPoint(point);
      setSharedLabel(params.get("label"));
    }
  }, []);

  const livePoint = useMemo<LatLng | null>(
    () => (fix ? { lat: fix.lat, lng: fix.lng } : null),
    [fix],
  );

  const point = livePoint ?? sharedPoint ?? DEFAULT_CENTER;
  const live = livePoint !== null;

  const {
    link,
    copied,
    canNativeShare,
    copyLink,
    shareToWhatsApp,
    shareNative,
  } = useShareLocation({ point, label });

  const showBanner = sharedPoint !== null && !dismissed;

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-card/90 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-2xl items-center gap-3 px-4 py-3.5">
          <a
            href="/"
            data-ocid="share.back_link"
            aria-label="Back to map"
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-accent/15 hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
          </a>
          <div className="flex min-w-0 flex-col">
            <h1 className="font-display text-base font-semibold tracking-tight text-foreground">
              Share location
            </h1>
            <span className="truncate text-xs text-muted-foreground">
              {APP_NAME}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-5">
        {showBanner && sharedPoint && (
          <SharedLocationBanner
            point={sharedPoint}
            label={sharedLabel}
            onDismiss={() => setDismissed(true)}
          />
        )}

        {!live && status === "locating" && (
          <div
            data-ocid="share.locating_state"
            className="surface-glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground shadow-panel"
          >
            <Satellite
              className="size-4 shrink-0 animate-pulse text-primary"
              aria-hidden="true"
            />
            Acquiring your live position…
          </div>
        )}

        {!live && (status === "denied" || status === "unavailable") && (
          <div
            data-ocid="share.location_error_state"
            className="surface-glass flex items-center gap-3 rounded-2xl px-4 py-3 text-sm text-muted-foreground shadow-panel"
          >
            <Satellite
              className="size-4 shrink-0 text-warning"
              aria-hidden="true"
            />
            Live position unavailable — sharing the map centre instead.
          </div>
        )}

        <ShareLocationCard
          point={point}
          label={label}
          onLabelChange={setLabel}
          link={link}
          copied={copied}
          onCopy={() => void copyLink()}
          live={live}
        />

        <ShareChannels
          copied={copied}
          canNativeShare={canNativeShare}
          onCopy={() => void copyLink()}
          onWhatsApp={shareToWhatsApp}
          onNativeShare={() => void shareNative()}
        />

        <p className="px-1 pb-2 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()}. Built with love using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noreferrer"
            className="text-primary underline-offset-4 hover:underline"
          >
            caffeine.ai
          </a>
        </p>
      </main>
    </div>
  );
}
