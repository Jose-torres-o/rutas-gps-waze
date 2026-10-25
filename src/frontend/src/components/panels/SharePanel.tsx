import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { formatCoords } from "@/lib/format";
import { buildShareLink, whatsappShareUrl } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import {
  Check,
  Copy,
  Link2,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

interface SharePanelProps {
  open: boolean;
  onClose: () => void;
  point: LatLng;
  label: string | null;
  onPointChange: (point: LatLng, label: string | null) => void;
}

/** Share the current location as a deep link, including a WhatsApp intent. */
export function SharePanel({
  open,
  onClose,
  point,
  label,
  onPointChange,
}: SharePanelProps) {
  const [draftLabel, setDraftLabel] = useState(label ?? "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (open) setDraftLabel(label ?? "");
  }, [open, label]);

  const link = buildShareLink(point, draftLabel);
  const message = draftLabel.trim()
    ? `I'm sharing my location: ${draftLabel.trim()}`
    : "I'm sharing my live location";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  };

  const handleWhatsApp = () => {
    onPointChange(point, draftLabel.trim() || null);
    window.open(
      whatsappShareUrl(link, message),
      "_blank",
      "noopener,noreferrer",
    );
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      toast.error("Native sharing is not available on this device.");
      return;
    }
    try {
      await navigator.share({ title: "My location", text: message, url: link });
    } catch {
      /* The user dismissed the share sheet — nothing to report. */
    }
  };

  return (
    <Sheet open={open} onOpenChange={(next) => !next && onClose()}>
      <SheetContent
        side="bottom"
        data-ocid="share.sheet"
        className="max-h-[80dvh] gap-0 rounded-t-2xl border-border bg-card p-0 sm:inset-y-0 sm:left-auto sm:right-0 sm:h-full sm:max-h-none sm:w-[26rem] sm:max-w-md sm:rounded-none sm:border-l"
      >
        <SheetHeader className="border-b border-border px-5 py-4">
          <SheetTitle className="font-display text-lg">
            Share location
          </SheetTitle>
          <SheetDescription>
            Send a link that reopens this app centred on your position.
          </SheetDescription>
        </SheetHeader>

        <div className="flex flex-col gap-4 px-5 py-4">
          <div className="flex items-center gap-2 rounded-xl border border-border bg-background/40 px-3 py-2.5">
            <MapPin
              className="size-4 shrink-0 text-primary"
              aria-hidden="true"
            />
            <span className="telemetry text-sm text-foreground">
              {formatCoords(point.lat, point.lng)}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="share-label"
              className="text-xs font-medium uppercase tracking-wider text-muted-foreground"
            >
              Label (optional)
            </label>
            <Input
              id="share-label"
              value={draftLabel}
              data-ocid="share.label_input"
              onChange={(event) => setDraftLabel(event.target.value)}
              placeholder="e.g. Meeting point"
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
                aria-label="Copy link"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="size-4 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-4" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2 pt-1">
            <Button
              type="button"
              data-ocid="share.whatsapp_button"
              onClick={handleWhatsApp}
              className="w-full bg-success text-success-foreground hover:bg-success/90"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Share via WhatsApp
            </Button>
            <Button
              type="button"
              variant="outline"
              data-ocid="share.native_button"
              onClick={handleNativeShare}
              className="w-full"
            >
              <Share2 className="size-4" aria-hidden="true" />
              More sharing options
            </Button>
          </div>

          <p className="flex items-start gap-2 text-xs text-muted-foreground">
            <Link2 className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            Anyone opening the link lands on the map centred on this exact
            point.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
