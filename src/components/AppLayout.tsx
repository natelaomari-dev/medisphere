import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Bell, Command } from "lucide-react";
import { Outlet } from "react-router-dom";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b border-border px-4 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-8 w-8" />
              <div className="hidden md:flex items-center gap-2 ml-2 px-3 py-1.5 rounded-md bg-muted/50 text-muted-foreground text-sm cursor-pointer hover:bg-muted transition-colors">
                <Search className="h-3.5 w-3.5" />
                <span>Search patients, records...</span>
                <kbd className="ml-4 text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono">
                  <Command className="h-2.5 w-2.5 inline" />K
                </kbd>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="relative h-8 w-8 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical" />
              </button>
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary">
                AO
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
