import {
  LayoutDashboard, Users, Calendar, Stethoscope, HeartPulse,
  FlaskConical, Pill, Receipt, Package, BedDouble, Activity,
  Video, Brain, BarChart3, UserCog, Plug, Shield, Settings,
  Search, Bell, ChevronDown, Sparkles,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";

const mainModules = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Patients", url: "/patients", icon: Users },
  { title: "Appointments", url: "/appointments", icon: Calendar },
  { title: "Doctors", url: "/doctors", icon: Stethoscope },
  { title: "Nurses", url: "/nurses", icon: HeartPulse },
];

const clinicalModules = [
  { title: "Laboratory", url: "/laboratory", icon: FlaskConical },
  { title: "Pharmacy", url: "/pharmacy", icon: Pill },
  { title: "Inpatients", url: "/inpatients", icon: BedDouble },
  { title: "ICU Monitoring", url: "/icu", icon: Activity },
  { title: "Telemedicine", url: "/telemedicine", icon: Video },
];

const intelligenceModules = [
  { title: "AI Insights", url: "/ai-insights", icon: Brain },
  { title: "Smart Triage", url: "/triage", icon: Sparkles },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
];

const adminModules = [
  { title: "Billing", url: "/billing", icon: Receipt },
  { title: "Inventory", url: "/inventory", icon: Package },
  { title: "Staff", url: "/staff", icon: UserCog },
  { title: "Security Logs", url: "/security", icon: Shield },
  { title: "Settings", url: "/settings", icon: Settings },
];

function NavSection({ label, items, collapsed }: { label: string; items: typeof mainModules; collapsed: boolean }) {
  const location = useLocation();
  return (
    <SidebarGroup>
      {!collapsed && <SidebarGroupLabel className="text-sidebar-muted text-[11px] font-medium uppercase tracking-wider px-3">{label}</SidebarGroupLabel>}
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild>
                <NavLink
                  to={item.url}
                  end={item.url === "/"}
                  className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
                  activeClassName="sidebar-item-active"
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-4 py-5 border-b border-sidebar-border">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <Brain className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-sm font-semibold text-sidebar-accent-foreground tracking-tight">MediSphere AI</h1>
              <p className="text-[11px] text-sidebar-muted">Hospital Intelligence</p>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="py-2">
        <NavSection label="Overview" items={mainModules} collapsed={collapsed} />
        <NavSection label="Clinical" items={clinicalModules} collapsed={collapsed} />
        <NavSection label="Intelligence" items={intelligenceModules} collapsed={collapsed} />
        <NavSection label="Administration" items={adminModules} collapsed={collapsed} />
      </SidebarContent>

      <SidebarFooter className="px-4 py-3 border-t border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-full bg-sidebar-accent flex items-center justify-center text-xs font-medium text-sidebar-accent-foreground">
              Dr
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-sidebar-accent-foreground truncate">Dr. Amara Osei</p>
              <p className="text-[10px] text-sidebar-muted">Chief Medical Officer</p>
            </div>
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
}
