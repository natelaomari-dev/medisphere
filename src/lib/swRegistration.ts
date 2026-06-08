// Service worker registration with Lovable preview guard
const PREVIEW_HOST_PATTERNS = [
  (h: string) => h.startsWith("id-preview--"),
  (h: string) => h.startsWith("preview--"),
  (h: string) => h === "lovableproject.com" || h.endsWith(".lovableproject.com"),
  (h: string) => h === "lovableproject-dev.com" || h.endsWith(".lovableproject-dev.com"),
  (h: string) => h === "beta.lovable.dev" || h.endsWith(".beta.lovable.dev"),
];

function inIframe() {
  try { return window.self !== window.top; } catch { return true; }
}

function isPreviewContext() {
  const url = new URL(window.location.href);
  if (url.searchParams.get("sw") === "off") return true;
  const h = url.hostname;
  return PREVIEW_HOST_PATTERNS.some((m) => m(h));
}

export async function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  const refuse = !import.meta.env.PROD || inIframe() || isPreviewContext();

  if (refuse) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      for (const r of regs) {
        if ((r.active?.scriptURL || "").endsWith("/sw.js")) await r.unregister();
      }
    } catch {}
    return;
  }

  try {
    const { registerSW } = await import("virtual:pwa-register");
    registerSW({ immediate: true });
  } catch {
    /* plugin not present in dev */
  }
}
