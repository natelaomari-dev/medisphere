import { useLocation } from "react-router-dom";

const routeLabels: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/patients": "Patients",
  "/appointments": "Appointments",
  "/doctors": "Doctors",
  "/nurses": "Nurses",
  "/medical-records": "Medical Records",
  "/laboratory": "Laboratory",
  "/pharmacy": "Pharmacy",
  "/inpatients": "Inpatients",
  "/icu": "ICU Monitoring",
  "/telemedicine": "Telemedicine",
  "/ai-insights": "AI Insights",
  "/triage": "Smart Triage",
  "/analytics": "Analytics",
  "/billing": "Billing",
  "/insurance-claims": "Insurance Claims",
  "/moh-reports": "MOH Reports",
  "/inventory": "Inventory",
  "/staff": "Staff Management",
  "/security": "Security Logs",
  "/settings": "Settings",
  "/super-admin": "Platform Admin",
};

export function Breadcrumbs() {
  const location = useLocation();
  const label = routeLabels[location.pathname] || "Page";

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="hover:text-foreground cursor-pointer transition-colors">Home</span>
      <span>/</span>
      <span className="text-foreground font-medium">{label}</span>
    </nav>
  );
}
