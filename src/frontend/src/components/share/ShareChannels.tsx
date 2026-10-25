import { Button } from "@/components/ui/button";
import { Check, Copy, MessageCircle, Share2 } from "lucide-react";

interface ShareChannelsProps {
  copied: boolean;
  canNativeShare: boolean;
  onCopy: () => void;
  onWhatsApp: () => void;
  onNativeShare: () => void;
}

/**
 * The three share channels for a location link. WhatsApp is the primary
 * action; copy and the native share sheet are the secondary options.
 */
export function ShareChannels({
  copied,
  canNativeShare,
  onCopy,
  onWhatsApp,
  onNativeShare,
}: ShareChannelsProps) {
  return (
    <section
      data-ocid="share.channels"
      className="surface-glass flex flex-col gap-3 rounded-2xl p-5 shadow-panel"
    >
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-lg font-semibold tracking-tight text-foreground">
          Send it
        </h2>
        <p className="text-sm text-muted-foreground">
          WhatsApp opens with the message already written.
        </p>
      </div>

      <Button
        type="button"
        data-ocid="share.whatsapp_button"
        onClick={onWhatsApp}
        className="h-11 w-full rounded-full bg-success text-success-foreground hover:bg-success/90"
      >
        <MessageCircle className="size-4" aria-hidden="true" />
        Share via WhatsApp
      </Button>

      <div className="grid grid-cols-2 gap-3">
        <Button
          type="button"
          variant="outline"
          data-ocid="share.copy_button_secondary"
          onClick={onCopy}
          className="h-11 rounded-full"
        >
          {copied ? (
            <Check className="size-4 text-success" aria-hidden="true" />
          ) : (
            <Copy className="size-4" aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy link"}
        </Button>

        <Button
          type="button"
          variant="outline"
          data-ocid="share.native_button"
          onClick={onNativeShare}
          disabled={!canNativeShare}
          className="h-11 rounded-full"
        >
          <Share2 className="size-4" aria-hidden="true" />
          More options
        </Button>
      </div>

      {!canNativeShare && (
        <p className="text-xs text-muted-foreground">
          Native sharing is unavailable in this browser — use WhatsApp or copy
          the link instead.
        </p>
      )}
    </section>
  );
}
