import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { usePatients, useDoctors } from "@/hooks/useHospitalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Video, Plus, Calendar, Clock, CheckCircle2, XCircle, ExternalLink, MonitorSmartphone } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

const STATUS_CONFIG: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  scheduled: { label: "Scheduled", cls: "bg-sky-500/10 text-sky-600 border-sky-500/20", icon: <Calendar className="h-3 w-3" /> },
  in_progress: { label: "In Progress", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", icon: <Video className="h-3 w-3" /> },
  completed: { label: "Completed", cls: "bg-muted text-muted-foreground", icon: <CheckCircle2 className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", cls: "bg-destructive/10 text-destructive border-destructive/20", icon: <XCircle className="h-3 w-3" /> },
  no_show: { label: "No Show", cls: "bg-amber-500/10 text-amber-600 border-amber-500/20", icon: <Clock className="h-3 w-3" /> },
};

function useTeleconsultations() {
  return useQuery({
    queryKey: ["teleconsultations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("teleconsultations")
        .select("*, patients(first_name, last_name, patient_id), doctors(full_name, specialization)")
        .order("scheduled_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useCreateTeleconsult() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: any) => {
      const { data: result, error } = await supabase.from("teleconsultations").insert(data).select().single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teleconsultations"] }),
  });
}

function useUpdateTeleconsultStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "in_progress") updates.started_at = new Date().toISOString();
      if (status === "completed") updates.ended_at = new Date().toISOString();
      const { error } = await supabase.from("teleconsultations").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["teleconsultations"] }),
  });
}

export default function Telemedicine() {
  const { hospitalId } = useHospital();
  const { user } = useAuth();
  const { data: sessions, isLoading } = useTeleconsultations();
  const { data: patients } = usePatients();
  const { data: doctors } = useDoctors();
  const createSession = useCreateTeleconsult();
  const updateStatus = useUpdateTeleconsultStatus();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [form, setForm] = useState({
    patient_id: "", doctor_id: "", scheduled_at: "", duration_minutes: "30", reason: "", meeting_link: "",
  });

  const statusCounts = (sessions ?? []).reduce((acc, s) => {
    acc[s.status] = (acc[s.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const filtered = (sessions ?? []).filter((s) => {
    const patient = s.patients as any;
    const doctor = s.doctors as any;
    const term = search.toLowerCase();
    const matchSearch = (patient?.first_name ?? "").toLowerCase().includes(term) ||
      (patient?.last_name ?? "").toLowerCase().includes(term) ||
      (doctor?.full_name ?? "").toLowerCase().includes(term);
    const matchStatus = statusFilter === "all" || s.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const handleCreate = async () => {
    if (!form.patient_id || !form.doctor_id || !form.scheduled_at || !user) return;
    try {
      await createSession.mutateAsync({
        patient_id: form.patient_id,
        doctor_id: form.doctor_id,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        duration_minutes: Number(form.duration_minutes) || 30,
        reason: form.reason || null,
        meeting_link: form.meeting_link || null,
        hospital_id: hospitalId || null,
        created_by: user.id,
      });
      toast.success("Teleconsultation scheduled");
      setDialogOpen(false);
      setForm({ patient_id: "", doctor_id: "", scheduled_at: "", duration_minutes: "30", reason: "", meeting_link: "" });
    } catch {
      toast.error("Failed to schedule teleconsultation");
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Status updated to ${STATUS_CONFIG[status]?.label}`);
    } catch {
      toast.error("Failed to update status");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Telemedicine</h1>
          <p className="text-sm text-muted-foreground">
            {sessions?.length ?? 0} consultations · {statusCounts["scheduled"] || 0} upcoming
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Schedule Consultation</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader><DialogTitle>Schedule Teleconsultation</DialogTitle></DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="space-y-1.5">
                <Label>Patient</Label>
                <Select value={form.patient_id} onValueChange={(v) => setForm((p) => ({ ...p, patient_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {(patients ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.patient_id} — {p.first_name} {p.last_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Doctor</Label>
                <Select value={form.doctor_id} onValueChange={(v) => setForm((p) => ({ ...p, doctor_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                  <SelectContent>
                    {(doctors ?? []).filter((d) => d.is_available).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.full_name} — {d.specialization}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Date & Time</Label>
                  <Input type="datetime-local" value={form.scheduled_at} onChange={(e) => setForm((p) => ({ ...p, scheduled_at: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Duration (min)</Label>
                  <Select value={form.duration_minutes} onValueChange={(v) => setForm((p) => ({ ...p, duration_minutes: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 min</SelectItem>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Reason</Label>
                <Input value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} placeholder="Consultation reason..." />
              </div>
              <div className="space-y-1.5">
                <Label>Meeting Link (optional)</Label>
                <Input value={form.meeting_link} onChange={(e) => setForm((p) => ({ ...p, meeting_link: e.target.value }))} placeholder="https://meet.google.com/..." />
              </div>
              <Button onClick={handleCreate} disabled={createSession.isPending || !form.patient_id || !form.doctor_id || !form.scheduled_at} className="w-full mt-2">
                {createSession.isPending ? "Scheduling..." : "Schedule Consultation"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
          <Card key={key}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">{cfg.icon}</div>
              <div>
                <p className="text-2xl font-bold text-foreground">{statusCounts[key] || 0}</p>
                <p className="text-xs text-muted-foreground">{cfg.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search by patient or doctor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="All Statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => <SelectItem key={k} value={k}>{v.label}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><MonitorSmartphone className="h-4 w-4" /> Consultations</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {(sessions ?? []).length === 0 ? "No teleconsultations yet. Schedule one to get started." : "No consultations match your filters."}
            </div>
          ) : (
            <Table>
              <TableHeader><TableRow>
                <TableHead>Patient</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Scheduled</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Link</TableHead>
                <TableHead className="w-[140px]">Action</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const patient = s.patients as any;
                  const doctor = s.doctors as any;
                  const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.scheduled;
                  return (
                    <TableRow key={s.id}>
                      <TableCell>
                        <div className="text-sm font-medium">{patient?.first_name} {patient?.last_name}</div>
                        <div className="text-xs text-muted-foreground">{patient?.patient_id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium">{doctor?.full_name}</div>
                        <div className="text-xs text-muted-foreground">{doctor?.specialization}</div>
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(s.scheduled_at), "MMM d, yyyy · h:mm a")}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.duration_minutes} min</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={cfg.cls}>
                          <span className="flex items-center gap-1">{cfg.icon} {cfg.label}</span>
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {s.meeting_link ? (
                          <a href={s.meeting_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-xs flex items-center gap-1">
                            Join <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : <span className="text-xs text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell>
                        {(s.status === "scheduled" || s.status === "in_progress") && (
                          <Select value={s.status} onValueChange={(v) => handleStatusChange(s.id, v)}>
                            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="scheduled">Scheduled</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="cancelled">Cancelled</SelectItem>
                              <SelectItem value="no_show">No Show</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
