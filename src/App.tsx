import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { HospitalProvider, useHospital } from "@/hooks/useHospital";
import { AppLayout } from "@/components/AppLayout";
import LandingPage from "./pages/LandingPage";
import Dashboard from "./pages/Dashboard";
import Doctors from "./pages/Doctors";
import Patients from "./pages/Patients";
import AIInsights from "./pages/AIInsights";
import SmartTriage from "./pages/SmartTriage";
import Appointments from "./pages/Appointments";
import AuthPage from "./pages/AuthPage";
import Onboarding from "./pages/Onboarding";
import StaffManagement from "./pages/StaffManagement";
import Nurses from "./pages/Nurses";
import Laboratory from "./pages/Laboratory";
import ICUMonitoring from "./pages/ICUMonitoring";
import Pharmacy from "./pages/Pharmacy";
import Telemedicine from "./pages/Telemedicine";
import Billing from "./pages/Billing";
import MedicalRecords from "./pages/MedicalRecords";
import InpatientManagement from "./pages/InpatientManagement";
import InsuranceClaims from "./pages/InsuranceClaims";
import MOHReports from "./pages/MOHReports";
import PlaceholderPage from "./pages/PlaceholderPage";
import SuperAdmin from "./pages/SuperAdmin";
import Settings from "./pages/Settings";
import Analytics from "./pages/Analytics";
import Inventory from "./pages/Inventory";
import NotFound from "./pages/NotFound";
import MCH from "./pages/MCH";
import Pediatrics from "./pages/Pediatrics";
import HIVCare from "./pages/HIVCare";
import TBCare from "./pages/TBCare";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: hospLoading } = useHospital();

  if (authLoading || hospLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (needsOnboarding) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function OnboardingRoute() {
  const { user, loading: authLoading } = useAuth();
  const { needsOnboarding, loading: hospLoading } = useHospital();

  if (authLoading || hospLoading) return null;
  if (!user) return <Navigate to="/auth" replace />;
  if (!needsOnboarding) return <Navigate to="/dashboard" replace />;
  return <Onboarding />;
}

function PublicOnly({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<PublicOnly><LandingPage /></PublicOnly>} />
      <Route path="/auth" element={<AuthPage />} />
      <Route path="/onboarding" element={<OnboardingRoute />} />
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/patients" element={<Patients />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/triage" element={<SmartTriage />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/doctors" element={<Doctors />} />
        <Route path="/nurses" element={<Nurses />} />
        <Route path="/laboratory" element={<Laboratory />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/inpatients" element={<InpatientManagement />} />
        <Route path="/medical-records" element={<MedicalRecords />} />
        <Route path="/icu" element={<ICUMonitoring />} />
        <Route path="/telemedicine" element={<Telemedicine />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/insurance-claims" element={<InsuranceClaims />} />
        <Route path="/moh-reports" element={<MOHReports />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/staff" element={<StaffManagement />} />
        <Route path="/security" element={<PlaceholderPage />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/super-admin" element={<SuperAdmin />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  </BrowserRouter>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <HospitalProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppRoutes />
        </TooltipProvider>
      </HospitalProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
