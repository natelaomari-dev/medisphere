import { useEffect, useState } from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

export function OfflineBadge() {
  const { t } = useTranslation();
  const [online, setOnline] = useState(navigator.onLine);
  const [pending, setPending] = useState<number>(0);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    const onPending = (e: any) => setPending(e.detail?.count || 0);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    window.addEventListener("ms:pending-sync", onPending as any);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("ms:pending-sync", onPending as any);
    };
  }, []);

  if (online && pending === 0) return null;

  return (
    <div className={`hidden md:flex h-9 px-2.5 rounded-lg items-center gap-1.5 text-xs font-medium border ${
      !online ? "bg-warning/10 border-warning/30 text-warning" : "bg-muted border-border text-muted-foreground"
    }`}>
      {!online ? <WifiOff className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
      <span>{!online ? t("offline.offline") : t("offline.pending_sync", { count: pending })}</span>
    </div>
  );
}
