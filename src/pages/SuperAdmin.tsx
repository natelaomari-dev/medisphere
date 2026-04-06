import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Building2, Users, TrendingUp, DollarSign, Search,
  Shield, Activity, Crown, AlertTriangle, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const planColors: Record<string, string> = {
  free: "bg-muted text-muted-foreground",
  basic: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  professional: "bg-primary/10 text-primary",
  enterprise: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const statusColors: Record<string, string> = {
  active: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  trial: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200",
  suspended: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
  past_due: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200",
};

const planPricing: Record<string, { fee: number; users: number; patients: number }> = {
  free: { fee: 0, users: 5, patients: 100 },
  basic: { fee: 4999, users: 20, patients: 500 },
  professional: { fee: 14999, users: 50, patients: 2000 },
  enterprise: { fee: 49999, users: 999, patients: 99999 },
};

export default function SuperAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");

  // Fetch all hospitals with subscriptions
  const { data: hospitals = [], isLoading } = useQuery({
    queryKey: ["platform-hospitals"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospitals")
        .select("*, hospital_subscriptions(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Fetch member counts per hospital
  const { data: memberCounts = {} } = useQuery({
    queryKey: ["platform-member-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_members")
        .select("hospital_id")
        .eq("is_active", true);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((m: any) => {
        counts[m.hospital_id] = (counts[m.hospital_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch patient counts per hospital
  const { data: patientCounts = {} } = useQuery({
    queryKey: ["platform-patient-counts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("patients").select("hospital_id");
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((p: any) => {
        if (p.hospital_id) counts[p.hospital_id] = (counts[p.hospital_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Fetch audit logs
  const { data: auditLogs = [] } = useQuery({
    queryKey: ["platform-audit-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Update subscription mutation
  const updateSubscription = useMutation({
    mutationFn: async ({ hospitalId, plan }: { hospitalId: string; plan: string }) => {
      const pricing = planPricing[plan] || planPricing.free;

      // Check if subscription exists
      const { data: existing } = await supabase
        .from("hospital_subscriptions")
        .select("id")
        .eq("hospital_id", hospitalId)
        .single();

      if (existing) {
        const { error } = await supabase
          .from("hospital_subscriptions")
          .update({
            plan: plan as any,
            monthly_fee: pricing.fee,
            max_users: pricing.users,
            max_patients: pricing.patients,
            status: "active" as any,
          })
          .eq("hospital_id", hospitalId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("hospital_subscriptions")
          .insert({
            hospital_id: hospitalId,
            plan: plan as any,
            monthly_fee: pricing.fee,
            max_users: pricing.users,
            max_patients: pricing.patients,
            status: "active" as any,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-hospitals"] });
      toast.success("Subscription updated");
    },
    onError: (err: any) => toast.error(err.message),
  });

  // Suspend/activate hospital
  const toggleHospitalStatus = useMutation({
    mutationFn: async ({ hospitalId, activate }: { hospitalId: string; activate: boolean }) => {
      const { error } = await supabase
        .from("hospitals")
        .update({ is_active: activate })
        .eq("id", hospitalId);
      if (error) throw error;

      if (!activate) {
        await supabase
          .from("hospital_subscriptions")
          .update({ status: "suspended" as any })
          .eq("hospital_id", hospitalId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-hospitals"] });
      toast.success("Hospital status updated");
    },
  });

  // Stats
  const totalHospitals = hospitals.length;
  const activeHospitals = hospitals.filter((h: any) => h.is_active).length;
  const totalUsers = Object.values(memberCounts).reduce((a: number, b: number) => a + b, 0);
  const totalPatients = Object.values(patientCounts).reduce((a: number, b: number) => a + b, 0);
  const monthlyRevenue = hospitals.reduce((sum: number, h: any) => {
    const sub = h.hospital_subscriptions?.[0];
    return sum + (sub?.monthly_fee || 0);
  }, 0);

  // Filter
  const filtered = hospitals.filter((h: any) => {
    const matchSearch = h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.city?.toLowerCase().includes(search.toLowerCase());
    const sub = h.hospital_subscriptions?.[0];
    const matchPlan = planFilter === "all" || sub?.plan === planFilter;
    return matchSearch && matchPlan;
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Crown className="h-5 w-5 text-amber-500" />
          <h1 className="text-2xl font-bold text-foreground">Platform Administration</h1>
        </div>
        <p className="text-sm text-muted-foreground">Infera Tech Solutions — MediSphere SaaS Management</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Hospitals</p>
                <p className="text-2xl font-bold text-foreground">{totalHospitals}</p>
              </div>
              <Building2 className="h-8 w-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Active Tenants</p>
                <p className="text-2xl font-bold text-foreground">{activeHospitals}</p>
              </div>
              <Activity className="h-8 w-8 text-emerald-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
              </div>
              <Users className="h-8 w-8 text-blue-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Total Patients</p>
                <p className="text-2xl font-bold text-foreground">{totalPatients}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-violet-500/30" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">MRR (KES)</p>
                <p className="text-2xl font-bold text-foreground">{monthlyRevenue.toLocaleString()}</p>
              </div>
              <DollarSign className="h-8 w-8 text-amber-500/30" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tenants">
        <TabsList>
          <TabsTrigger value="tenants">Tenants</TabsTrigger>
          <TabsTrigger value="audit">Audit Log</TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search hospitals..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={planFilter} onValueChange={setPlanFilter}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Plans</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="basic">Basic</SelectItem>
                <SelectItem value="professional">Professional</SelectItem>
                <SelectItem value="enterprise">Enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hospital</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Users</TableHead>
                    <TableHead>Patients</TableHead>
                    <TableHead>MRR (KES)</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                    </TableRow>
                  ) : filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">No hospitals found</TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((h: any) => {
                      const sub = h.hospital_subscriptions?.[0];
                      const plan = sub?.plan || "free";
                      const status = sub?.status || "trial";
                      const users = memberCounts[h.id] || 0;
                      const patients = patientCounts[h.id] || 0;

                      return (
                        <TableRow key={h.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-foreground">{h.name}</p>
                              <p className="text-xs text-muted-foreground">{h.city || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={plan}
                              onValueChange={(val) => updateSubscription.mutate({ hospitalId: h.id, plan: val })}
                            >
                              <SelectTrigger className="h-7 w-28 text-xs">
                                <Badge className={`${planColors[plan]} text-xs`}>{plan}</Badge>
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="professional">Professional</SelectItem>
                                <SelectItem value="enterprise">Enterprise</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>
                            <Badge className={`${statusColors[status]} text-xs`}>{status}</Badge>
                          </TableCell>
                          <TableCell className="text-foreground">{users}</TableCell>
                          <TableCell className="text-foreground">{patients}</TableCell>
                          <TableCell className="text-foreground font-medium">
                            {(sub?.monthly_fee || 0).toLocaleString()}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {format(new Date(h.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant={h.is_active ? "destructive" : "default"}
                              size="sm"
                              className="text-xs h-7"
                              onClick={() => toggleHospitalStatus.mutate({ hospitalId: h.id, activate: !h.is_active })}
                            >
                              {h.is_active ? "Suspend" : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Platform Audit Log</CardTitle>
              <CardDescription>Recent platform-level actions</CardDescription>
            </CardHeader>
            <CardContent>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">No audit logs yet</p>
              ) : (
                <div className="space-y-2">
                  {auditLogs.map((log: any) => (
                    <div key={log.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/30">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-sm font-medium text-foreground">{log.action}</p>
                          <p className="text-xs text-muted-foreground">{log.target_type} → {log.target_id?.slice(0, 8)}</p>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), "MMM d, HH:mm")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
