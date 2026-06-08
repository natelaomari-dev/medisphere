// Returns react-query options tuned for low-bandwidth mode.
import { useAppPreferences } from "@/contexts/AppPreferences";

export function useQueryTuning() {
  const { lowBandwidth } = useAppPreferences();
  return {
    pageSize: lowBandwidth ? 10 : 50,
    refetchInterval: lowBandwidth ? false : 30_000,
    refetchOnWindowFocus: !lowBandwidth,
    staleTime: lowBandwidth ? 1000 * 60 * 5 : 1000 * 30,
    enableRealtime: !lowBandwidth,
    showImages: !lowBandwidth,
    lowBandwidth,
  };
}
