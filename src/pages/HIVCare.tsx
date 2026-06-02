import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Activity, Pill, TrendingUp } from "lucide-react";
import { useHospital } from "@/hooks/useHospital";
import { usePatients } from "@/hooks/useHospitalData";
import {
  useHivEnrollment, useAddHivEnrollment, useArtRegimens, useAddArtRegimen,
  useViralLoads, useAddViralLoad, useArtDispenses, useAddArtDispense,
} from "@/hooks/useClinicalModules";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";

export default function HIVCare() {
  const { data: patients } = usePatients();
  const { hospitalId } = useHospital();
  const [patientId, setPatientId] = useState<string>("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">HIV Care</h1>
        <p className="text-sm text-muted-foreground">Comprehensive care center: enrollment, ART, viral load, dispensing</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Label>Select patient</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose patient..." /></SelectTrigger>
            <SelectContent>
              {patients?.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {patientId && (
        <Tabs defaultValue="enroll">
          <TabsList>
            <TabsTrigger value="enroll">Enrollment</TabsTrigger>
            <TabsTrigger value="regimen"><Pill className="h-4 w-4 mr-2" />ART Regimens</TabsTrigger>
            <TabsTrigger value="vl"><TrendingUp className="h-4 w-4 mr-2" />Viral Load</TabsTrigger>
            <TabsTrigger value="adherence"><Activity className="h-4 w-4 mr-2" />Adherence</TabsTrigger>
          </TabsList>
          <TabsContent value="enroll"><EnrollmentTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="regimen"><RegimenTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="vl"><VlTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="adherence"><AdherenceTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function EnrollmentTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: enroll, refetch } = useHivEnrollment(patientId);
  const add = useAddHivEnrollment();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ enrollment_date: format(new Date(), "yyyy-MM-dd"), art_eligible: true, partner_testing_done: false });

  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        who_stage: f.who_stage ? +f.who_stage : null,
        baseline_cd4: f.baseline_cd4 ? +f.baseline_cd4 : null,
        baseline_vl: f.baseline_vl ? +f.baseline_vl : null,
      });
      toast({ title: "Enrolled in HIV care" }); setOpen(false); refetch();
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>HIV Enrollment</CardTitle>
        {!enroll && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Enroll</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>HIV Enrollment</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>CCC #</Label><Input value={f.ccc_number || ""} onChange={e => setF({ ...f, ccc_number: e.target.value })} /></div>
                <div><Label>Enrollment date</Label><Input type="date" value={f.enrollment_date} onChange={e => setF({ ...f, enrollment_date: e.target.value })} /></div>
                <div><Label>WHO stage</Label>
                  <Select value={String(f.who_stage || "")} onValueChange={v => setF({ ...f, who_stage: +v })}>
                    <SelectTrigger><SelectValue placeholder="Stage" /></SelectTrigger>
                    <SelectContent>{[1,2,3,4].map(s => <SelectItem key={s} value={String(s)}>Stage {s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Baseline CD4</Label><Input type="number" value={f.baseline_cd4 || ""} onChange={e => setF({ ...f, baseline_cd4: e.target.value })} /></div>
                <div><Label>Baseline VL</Label><Input type="number" value={f.baseline_vl || ""} onChange={e => setF({ ...f, baseline_vl: e.target.value })} /></div>
                <div className="flex items-center gap-2 mt-6"><Switch checked={f.art_eligible} onCheckedChange={v => setF({ ...f, art_eligible: v })} /><Label>ART eligible</Label></div>
                <div className="flex items-center gap-2"><Switch checked={f.partner_testing_done} onCheckedChange={v => setF({ ...f, partner_testing_done: v })} /><Label>Partner tested</Label></div>
              </div>
              <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Enroll</Button>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent>
        {!enroll ? <p className="text-sm text-muted-foreground">Not enrolled in HIV care.</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><p className="text-muted-foreground text-xs">CCC #</p><p className="font-semibold">{enroll.ccc_number || "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">Enrolled</p><p className="font-semibold">{format(new Date(enroll.enrollment_date), "MMM d, yyyy")}</p></div>
            <div><p className="text-muted-foreground text-xs">WHO Stage</p><p className="font-semibold">{enroll.who_stage || "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">Baseline CD4</p><p className="font-semibold">{enroll.baseline_cd4 || "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">Baseline VL</p><p className="font-semibold">{enroll.baseline_vl || "—"}</p></div>
            <div><p className="text-muted-foreground text-xs">ART eligible</p><p className="font-semibold">{enroll.art_eligible ? "Yes" : "No"}</p></div>
            <div><p className="text-muted-foreground text-xs">Partner tested</p><p className="font-semibold">{enroll.partner_testing_done ? "Yes" : "No"}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegimenTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: regimens } = useArtRegimens(patientId);
  const add = useAddArtRegimen();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ start_date: format(new Date(), "yyyy-MM-dd") });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId });
      toast({ title: "Regimen added" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ART Regimen History</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ART Regimen</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Regimen code</Label><Input value={f.regimen_code || ""} onChange={e => setF({ ...f, regimen_code: e.target.value })} placeholder="e.g. TDF/3TC/DTG" /></div>
              <div><Label>Start date</Label><Input type="date" value={f.start_date} onChange={e => setF({ ...f, start_date: e.target.value })} /></div>
              <div><Label>End date</Label><Input type="date" value={f.end_date || ""} onChange={e => setF({ ...f, end_date: e.target.value })} /></div>
              <div><Label>Reason for change</Label><Input value={f.reason_for_change || ""} onChange={e => setF({ ...f, reason_for_change: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={!f.regimen_code || add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Regimen</TableHead><TableHead>Start</TableHead><TableHead>End</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
          <TableBody>
            {!regimens?.length ? <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">No regimens</TableCell></TableRow> :
              regimens.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.regimen_code}</TableCell>
                  <TableCell>{format(new Date(r.start_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{r.end_date ? format(new Date(r.end_date), "MMM d, yyyy") : <Badge variant="outline">Current</Badge>}</TableCell>
                  <TableCell className="text-xs">{r.reason_for_change || "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function VlTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: vls } = useViralLoads(patientId);
  const add = useAddViralLoad();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ sample_date: format(new Date(), "yyyy-MM-dd") });
  const submit = async () => {
    try {
      const cpm = f.copies_per_ml ? +f.copies_per_ml : null;
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        copies_per_ml: cpm,
        undetectable: cpm !== null ? cpm < 50 : null,
        suppressed: cpm !== null ? cpm < 1000 : null,
      });
      toast({ title: "Viral load saved" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  const chartData = (vls || []).map((v: any) => ({ date: format(new Date(v.sample_date), "MMM yy"), value: Math.log10(Math.max(1, v.copies_per_ml || 1)), copies: v.copies_per_ml }));
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Viral Load Trend (log10)</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add VL</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Viral Load Result</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sample date</Label><Input type="date" value={f.sample_date} onChange={e => setF({ ...f, sample_date: e.target.value })} /></div>
                <div><Label>Result date</Label><Input type="date" value={f.result_date || ""} onChange={e => setF({ ...f, result_date: e.target.value })} /></div>
                <div className="col-span-2"><Label>Copies / mL</Label><Input type="number" value={f.copies_per_ml || ""} onChange={e => setF({ ...f, copies_per_ml: e.target.value })} /></div>
                <div className="col-span-2"><Label>Lab facility</Label><Input value={f.lab_facility || ""} onChange={e => setF({ ...f, lab_facility: e.target.value })} /></div>
              </div>
              <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis label={{ value: "log10 copies/mL", angle: -90, position: "insideLeft" }} />
                <Tooltip formatter={(v: any, _n, p: any) => [`${p.payload.copies} copies/mL`, "VL"]} />
                <ReferenceLine y={Math.log10(1000)} stroke="hsl(var(--warning))" strokeDasharray="4 4" label="Suppression (1000)" />
                <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-6">No VL results.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

function AdherenceTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: disp } = useArtDispenses(patientId);
  const add = useAddArtDispense();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ dispense_date: format(new Date(), "yyyy-MM-dd") });

  const adherence = useMemo(() => {
    if (!disp || disp.length < 2) return null;
    const sorted = [...disp].sort((a, b) => new Date(a.dispense_date).getTime() - new Date(b.dispense_date).getTime());
    let coveredDays = 0, totalDays = 0;
    for (let i = 0; i < sorted.length - 1; i++) {
      const gap = differenceInDays(new Date(sorted[i + 1].dispense_date), new Date(sorted[i].dispense_date));
      totalDays += gap;
      coveredDays += Math.min(gap, sorted[i].days_supplied || 0);
    }
    return totalDays > 0 ? Math.round((coveredDays / totalDays) * 100) : null;
  }, [disp]);

  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        pills_dispensed: f.pills_dispensed ? +f.pills_dispensed : null,
        days_supplied: f.days_supplied ? +f.days_supplied : null,
      });
      toast({ title: "Dispense recorded" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ART Dispensing & Adherence {adherence !== null && <Badge className="ml-2">{adherence}% MPR</Badge>}</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Dispense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>ART Dispense</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={f.dispense_date} onChange={e => setF({ ...f, dispense_date: e.target.value })} /></div>
              <div><Label>Regimen</Label><Input value={f.regimen_code || ""} onChange={e => setF({ ...f, regimen_code: e.target.value })} /></div>
              <div><Label>Pills dispensed</Label><Input type="number" value={f.pills_dispensed || ""} onChange={e => setF({ ...f, pills_dispensed: e.target.value })} /></div>
              <div><Label>Days supplied</Label><Input type="number" value={f.days_supplied || ""} onChange={e => setF({ ...f, days_supplied: e.target.value })} /></div>
              <div className="col-span-2"><Label>Next appointment</Label><Input type="date" value={f.next_appointment || ""} onChange={e => setF({ ...f, next_appointment: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Regimen</TableHead><TableHead>Pills</TableHead><TableHead>Days</TableHead><TableHead>Next</TableHead></TableRow></TableHeader>
          <TableBody>
            {!disp?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No dispenses</TableCell></TableRow> :
              disp.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{format(new Date(d.dispense_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{d.regimen_code || "—"}</TableCell>
                  <TableCell>{d.pills_dispensed ?? "—"}</TableCell>
                  <TableCell>{d.days_supplied ?? "—"}</TableCell>
                  <TableCell>{d.next_appointment || "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
