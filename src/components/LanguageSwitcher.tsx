import { Globe } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAppPreferences } from "@/contexts/AppPreferences";
import { SUPPORTED_LANGUAGES } from "@/i18n";

export function LanguageSwitcher() {
  const { language, setLanguage } = useAppPreferences();
  const current = SUPPORTED_LANGUAGES.find(l => l.code === language) || SUPPORTED_LANGUAGES[0];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="h-9 px-2.5 rounded-lg bg-card border border-border flex items-center gap-1.5 text-xs font-medium text-foreground hover:bg-muted transition-colors">
          <Globe className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{current.label}</span>
          <span className="sm:hidden uppercase">{current.code}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {SUPPORTED_LANGUAGES.map(l => (
          <DropdownMenuItem key={l.code} onClick={() => setLanguage(l.code)} className={l.code === language ? "bg-accent" : ""}>
            <span className={l.rtl ? "text-right w-full" : ""}>{l.label}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
