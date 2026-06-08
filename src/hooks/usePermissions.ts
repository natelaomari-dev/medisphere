import { useHospital } from "@/hooks/useHospital";

type AppRole = "admin" | "doctor" | "nurse" | "pharmacist" | "lab_tech" | "receptionist";

// Which roles can access which routes
const routePermissions: Record<string, AppRole[]> = {
  "/dashboard": ["admin", "doctor", "nurse", "pharmacist", "lab_tech", "receptionist"],
  "/patients": ["admin", "doctor", "nurse", "receptionist"],
  "/appointments": ["admin", "doctor", "nurse", "receptionist"],
  "/doctors": ["admin", "doctor", "nurse", "receptionist"],
  "/nurses": ["admin", "nurse"],
  "/medical-records": ["admin", "doctor", "nurse"],
  "/laboratory": ["admin", "doctor", "lab_tech"],
  "/pharmacy": ["admin", "doctor", "pharmacist"],
  "/inpatients": ["admin", "doctor", "nurse"],
  "/icu": ["admin", "doctor", "nurse"],
  "/telemedicine": ["admin", "doctor"],
  "/mch": ["admin", "doctor", "nurse"],
  "/pediatrics": ["admin", "doctor", "nurse"],
  "/operating-theatre": ["admin", "doctor", "nurse"],
  "/blood-bank": ["admin", "doctor", "nurse", "lab_tech"],
  "/mortuary": ["admin", "nurse"],
  "/queue": ["admin", "doctor", "nurse", "receptionist", "pharmacist", "lab_tech"],
  "/hiv-care": ["admin", "doctor", "nurse", "pharmacist"],
  "/tb-care": ["admin", "doctor", "nurse"],
  "/ai-insights": ["admin", "doctor"],
  "/triage": ["admin", "doctor", "nurse"],
  "/analytics": ["admin"],
  "/billing": ["admin", "receptionist"],
  "/insurance-claims": ["admin", "receptionist"],
  "/moh-reports": ["admin"],
  "/claim-batches": ["admin", "receptionist"],
  "/integrations": ["admin"],
  "/notifications": ["admin", "doctor", "nurse", "receptionist"],
  "/inventory": ["admin", "pharmacist"],
  "/staff": ["admin"],
  "/security": ["admin"],
  "/settings": ["admin"],
  "/super-admin": ["admin"],
};

export function usePermissions() {
  const { userRole } = useHospital();
  const role = (userRole || "receptionist") as AppRole;

  const canAccess = (route: string): boolean => {
    const allowed = routePermissions[route];
    if (!allowed) return true; // If not defined, allow
    return allowed.includes(role);
  };

  const filterNavItems = <T extends { url: string }>(items: T[]): T[] => {
    return items.filter((item) => canAccess(item.url));
  };

  return { role, canAccess, filterNavItems };
}
