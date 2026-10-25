import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

/**
 * Generated components address their interactive surfaces with `data-ocid`
 * rather than a role or label, so the test-id attribute is pointed at it once
 * here instead of being misread as a timing failure in every suite.
 */
configure({ testIdAttribute: "data-ocid" });

afterEach(() => {
  cleanup();
});

/* jsdom does not implement ResizeObserver, which the map shell uses to size
 * its overlay layer. A no-op observer is enough: tests assert on rendered
 * output, not on measured layout. */
class ResizeObserverStub {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
}

if (!("ResizeObserver" in globalThis)) {
  Object.defineProperty(globalThis, "ResizeObserver", {
    writable: true,
    configurable: true,
    value: ResizeObserverStub,
  });
}

/* jsdom has no matchMedia; the responsive hooks query it on mount. */
if (!window.matchMedia) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }),
  });
}

/* jsdom does not implement scrollIntoView, which Radix calls when a select or
 * dialog opens. */
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
