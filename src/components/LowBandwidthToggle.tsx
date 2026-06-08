import { Zap, ZapOff } from "lucide-react";
import { useAppPreferences } from "@/contexts/AppPreferences";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useTranslation } from "react-i18next";

export function LowBandwidthToggle() {
  const { lowBandwidth, setLowBandwidth } = useAppPreferences();
  const { t } = useTranslation();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={() => setLowBandwidth(!lowBandwidth)}
          className={`h-9 w-9 rounded-lg border border-border flex items-center justify-center transition-colors ${
            lowBandwidth ? "bg-warning/20 text-warning" : "bg-card text-muted-foreground hover:bg-muted"
          }`}
          aria-label={t("settings.low_bandwidth")}
        >
          {lowBandwidth ? <ZapOff className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-xs">{t("settings.low_bandwidth")}</p>
        <p className="text-[10px] text-muted-foreground">{t("settings.low_bandwidth_desc")}</p>
      </TooltipContent>
    </Tooltip>
  );
}
