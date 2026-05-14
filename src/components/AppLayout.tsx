import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Search, Bell, Command } from "lucide-react";
import { Outlet } from "react-router-dom";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { ThemeToggle } from "@/components/ThemeToggle";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b border-border px-4 bg-card sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-8 w-8" />
              <div className="hidden md:block">
                <Breadcrumbs />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg bg-muted/60 border border-border text-muted-foreground text-sm w-72">
                <Search className="h-3.5 w-3.5" />
                <input
                  placeholder="Search patients, records..."
                  className="bg-transparent outline-none flex-1 text-sm text-foreground placeholder:text-muted-foreground"
                />
                <kbd className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 font-mono text-muted-foreground">
                  <Command className="h-2.5 w-2.5 inline" />K
                </kbd>
              </div>
              <ThemeToggle />
              <button className="relative h-9 w-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors">
                <Bell className="h-4 w-4" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-critical ring-2 ring-card" />
              </button>
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-[hsl(162,67%,28%)] flex items-center justify-center text-xs font-semibold text-primary-foreground shadow-sm">
                AO
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
      </div>
    </SidebarProvider>
  );
}
