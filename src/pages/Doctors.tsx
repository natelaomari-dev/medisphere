import { useState, useMemo } from "react";
import { useDoctors, useAddDoctor, useToggleDoctorAvailability } from "@/hooks/useHospitalData";
import { useHospital } from "@/hooks/useHospital";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Stethoscope, Phone, Mail, DollarSign } from "lucide-react";
import { toast } from "sonner";

const SPECIALIZATIONS = [
  "General Practice", "Cardiology", "Neurology", "Pediatrics", "Orthopedics",
  "Dermatology", "Oncology", "Psychiatry", "Radiology", "Surgery",
  "Obstetrics & Gynecology", "Emergency Medicine", "Anesthesiology", "Ophthalmology",
];

const DEPARTMENTS = [
  "General Ward", "Emergency", "ICU", "Surgery", "Pediatrics",
  "Outpatient", "Maternity", "Radiology", "Laboratory", "Pharmacy",
];

export default function Doctors() {
  const { data: doctors, isLoading } = useDoctors();
  const addDoctor = useAddDoctor();
  const toggleAvailability = useToggleDoctorAvailability();
  const { hospitalId } = useHospital();

  const [search, setSearch] = useState("");
  const [specFilter, setSpecFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Form state
  const [form, setForm] = useState({
    full_name: "", specialization: "", department: "",
    email: "", phone: "", license_number: "", consultation_fee: "",
  });

  const specializations = useMemo(() => {
    if (!doctors) return [];
    return [...new Set(doctors.map((d) => d.specialization))].sort();
  }, [doctors]);

  const departments = useMemo(() => {
    if (!doctors) return [];
    return [...new Set(doctors.map((d) => d.department).filter(Boolean))].sort();
  }, [doctors]);

  const filtered = useMemo(() => {
    if (!doctors) return [];
    return doctors.filter((d) => {
      const matchesSearch = d.full_name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization.toLowerCase().includes(search.toLowerCase());
      const matchesSpec = specFilter === "all" || d.specialization === specFilter;
      const matchesDept = deptFilter === "all" || d.department === deptFilter;
      return matchesSearch && matchesSpec && matchesDept;
    });
  }, [doctors, search, specFilter, deptFilter]);

  const handleAdd = async () => {
    if (!form.full_name || !form.specialization) {
      toast.error("Name and specialization are required");
      return;
    }
    try {
      await addDoctor.mutateAsync({
        full_name: form.full_name,
        specialization: form.specialization,
        department: form.department || null,
        email: form.email || null,
        phone: form.phone || null,
        license_number: form.license_number || null,
        consultation_fee: form.consultation_fee ? Number(form.consultation_fee) : null,
        hospital_id: hospitalId,
      });
      toast.success("Doctor added successfully");
      setDialogOpen(false);
      setForm({ full_name: "", specialization: "", department: "", email: "", phone: "", license_number: "", consultation_fee: "" });
    } catch {
      toast.error("Failed to add doctor");
    }
  };

  const handleToggle = (id: string, current: boolean | null) => {
    toggleAvailability.mutate({ id, is_available: !current });
  };

  const availableCount = doctors?.filter((d) => d.is_available).length ?? 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Doctors</h1>
          <p className="text-sm text-muted-foreground">
            {doctors?.length ?? 0} registered · {availableCount} available
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4" /> Add Doctor</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} placeholder="Dr. John Doe" />
                </div>
                <div className="space-y-1.5">
                  <Label>License Number</Label>
                  <Input value={form.license_number} onChange={(e) => setForm({ ...form, license_number: e.target.value })} placeholder="MDCN/12345" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Specialization *</Label>
                  <Select value={form.specialization} onValueChange={(v) => setForm({ ...form, specialization: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {SPECIALIZATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Select value={form.department} onValueChange={(v) => setForm({ ...form, department: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="doctor@hospital.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+234..." />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Consultation Fee (₦)</Label>
                <Input type="number" value={form.consultation_fee} onChange={(e) => setForm({ ...form, consultation_fee: e.target.value })} placeholder="5000" />
              </div>
              <Button onClick={handleAdd} disabled={addDoctor.isPending} className="w-full mt-2">
                {addDoctor.isPending ? "Adding..." : "Add Doctor"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search doctors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={specFilter} onValueChange={setSpecFilter}>
          <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Specialization" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Specializations</SelectItem>
            {specializations.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Department" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map((d) => <SelectItem key={d!} value={d!}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-5 space-y-3">
                <div className="h-5 bg-muted rounded w-2/3" />
                <div className="h-4 bg-muted rounded w-1/2" />
                <div className="h-4 bg-muted rounded w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Stethoscope className="h-12 w-12 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground font-medium">No doctors found</p>
            <p className="text-sm text-muted-foreground/70 mt-1">
              {doctors?.length ? "Try adjusting your filters" : "Add your first doctor to get started"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((doc) => (
            <Card key={doc.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                      {doc.full_name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{doc.full_name}</h3>
                      <p className="text-xs text-muted-foreground">{doc.specialization}</p>
                    </div>
                  </div>
                  <Switch
                    checked={doc.is_available ?? false}
                    onCheckedChange={() => handleToggle(doc.id, doc.is_available)}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  <Badge variant={doc.is_available ? "default" : "secondary"} className="text-[11px]">
                    {doc.is_available ? "Available" : "Unavailable"}
                  </Badge>
                  {doc.department && (
                    <Badge variant="outline" className="text-[11px]">{doc.department}</Badge>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-muted-foreground">
                  {doc.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {doc.email}
                    </div>
                  )}
                  {doc.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3" /> {doc.phone}
                    </div>
                  )}
                  {doc.consultation_fee && (
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-3 w-3" /> ₦{Number(doc.consultation_fee).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}