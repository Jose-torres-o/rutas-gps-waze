import { buildShareLink, whatsappShareUrl } from "@/lib/geo";
import type { LatLng } from "@/types/app";
import { useCallback, useMemo, useState } from "react";
import { toast } from "sonner";

interface UseShareLocationOptions {
  /** The point to share — normally the live GPS fix, falling back to map centre. */
  point: LatLng;
  /** Optional human label that travels with the link. */
  label?: string | null;
}

interface UseShareLocationResult {
  /** The deep link that reopens the app centred on the point. */
  link: string;
  /** The prefilled message body used by WhatsApp and the native share sheet. */
  message: string;
  /** True for a short window after a successful copy. */
  copied: boolean;
  /** True when the browser exposes the Web Share API. */
  canNativeShare: boolean;
  /** Copy the link to the clipboard. */
  copyLink: () => Promise<void>;
  /** Open WhatsApp with the prefilled location message. */
  shareToWhatsApp: () => void;
  /** Open the OS share sheet when available. */
  shareNative: () => Promise<void>;
}

/**
 * Builds the shareable location link and exposes the three share channels:
 * clipboard copy, a WhatsApp intent, and the native share sheet. All channels
 * use the same link so the recipient always lands on the same point.
 */
export function useShareLocation({
  point,
  label,
}: UseShareLocationOptions): UseShareLocationResult {
  const [copied, setCopied] = useState(false);

  const trimmedLabel = label?.trim() ?? "";

  const link = useMemo(
    () => buildShareLink(point, trimmedLabel || undefined),
    [point, trimmedLabel],
  );

  const message = useMemo(
    () =>
      trimmedLabel
        ? `I'm sharing my location: ${trimmedLabel}`
        : "I'm sharing my live location",
    [trimmedLabel],
  );

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      toast.success("Link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy the link.");
    }
  }, [link]);

  const shareToWhatsApp = useCallback(() => {
    window.open(
      whatsappShareUrl(link, message),
      "_blank",
      "noopener,noreferrer",
    );
  }, [link, message]);

  const canNativeShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  const shareNative = useCallback(async () => {
    if (!canNativeShare) {
      toast.error("Native sharing is not available on this device.");
      return;
    }
    try {
      await navigator.share({ title: "My location", text: message, url: link });
    } catch {
      /* The user dismissed the share sheet — nothing to report. */
    }
  }, [canNativeShare, link, message]);

  return {
    link,
    message,
    copied,
    canNativeShare,
    copyLink,
    shareToWhatsApp,
    shareNative,
  };
}
