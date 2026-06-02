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
import { Syringe, LineChart as LineChartIcon, Plus } from "lucide-react";
import { useHospital } from "@/hooks/useHospital";
import { usePatients } from "@/hooks/useHospitalData";
import { useKepiSchedule, useChildImmunizations, useRecordImmunization, useGrowthMonitoring, useAddGrowth } from "@/hooks/useClinicalModules";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from "recharts";

export default function Pediatrics() {
  const { hospitalId } = useHospital();
  const { data: patients } = usePatients();
  const [childId, setChildId] = useState<string>("");

  const children = useMemo(() => {
    return (patients || []).filter((p: any) => {
      if (!p.date_of_birth) return false;
      const years = (Date.now() - new Date(p.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365);
      return years < 18;
    });
  }, [patients]);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Pediatrics</h1>
        <p className="text-sm text-muted-foreground">Immunization schedule (KEPI) and growth monitoring</p>
      </div>
      <Card>
        <CardContent className="pt-4">
          <Label>Select child</Label>
          <Select value={childId} onValueChange={setChildId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose child..." /></SelectTrigger>
            <SelectContent>
              {children.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
      {childId && (
        <Tabs defaultValue="imm">
          <TabsList>
            <TabsTrigger value="imm"><Syringe className="h-4 w-4 mr-2" />Immunizations</TabsTrigger>
            <TabsTrigger value="growth"><LineChartIcon className="h-4 w-4 mr-2" />Growth</TabsTrigger>
          </TabsList>
          <TabsContent value="imm"><ImmTab childId={childId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="growth"><GrowthTab childId={childId} hospitalId={hospitalId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function ImmTab({ childId, hospitalId }: { childId: string; hospitalId: string | null }) {
  const { data: schedule } = useKepiSchedule();
  const { data: given } = useChildImmunizations(childId);
  const record = useRecordImmunization();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ kepi_id: "", given_date: format(new Date(), "yyyy-MM-dd"), batch_number: "" });

  const givenMap = useMemo(() => {
    const m: Record<string, any> = {};
    (given || []).forEach((g: any) => { if (g.kepi_id) m[g.kepi_id] = g; });
    return m;
  }, [given]);

  const submit = async () => {
    const item = schedule?.find((s: any) => s.id === f.kepi_id);
    if (!item) return;
    try {
      await record.mutateAsync({
        child_patient_id: childId, hospital_id: hospitalId, kepi_id: item.id,
        vaccine: item.vaccine, dose_number: item.dose_number,
        given_date: f.given_date, batch_number: f.batch_number || null,
      });
      toast({ title: "Immunization recorded" });
      setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>KEPI Schedule</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Record dose</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record immunization</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Vaccine</Label>
                <Select value={f.kepi_id} onValueChange={v => setF({ ...f, kepi_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Choose..." /></SelectTrigger>
                  <SelectContent>
                    {schedule?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.vaccine} (dose {s.dose_number}) — {s.age_weeks}w</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date given</Label><Input type="date" value={f.given_date} onChange={e => setF({ ...f, given_date: e.target.value })} /></div>
              <div><Label>Batch number</Label><Input value={f.batch_number} onChange={e => setF({ ...f, batch_number: e.target.value })} /></div>
              <Button onClick={submit} disabled={!f.kepi_id || record.isPending} className="w-full">Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Vaccine</TableHead><TableHead>Dose</TableHead><TableHead>Age</TableHead><TableHead>Route</TableHead><TableHead>Status</TableHead><TableHead>Given</TableHead><TableHead>Batch</TableHead></TableRow></TableHeader>
          <TableBody>
            {schedule?.map((s: any) => {
              const g = givenMap[s.id];
              return (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.vaccine}</TableCell>
                  <TableCell>{s.dose_number}</TableCell>
                  <TableCell>{s.age_weeks} wks</TableCell>
                  <TableCell className="text-xs">{s.route}</TableCell>
                  <TableCell>{g ? <Badge className="bg-success/10 text-success border-success/20">Given</Badge> : <Badge variant="outline">Due</Badge>}</TableCell>
                  <TableCell>{g?.given_date ? format(new Date(g.given_date), "MMM d, yyyy") : "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{g?.batch_number || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function GrowthTab({ childId, hospitalId }: { childId: string; hospitalId: string | null }) {
  const { data: visits } = useGrowthMonitoring(childId);
  const add = useAddGrowth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ visit_date: format(new Date(), "yyyy-MM-dd") });

  const submit = async () => {
    try {
      await add.mutateAsync({
        child_patient_id: childId, hospital_id: hospitalId,
        visit_date: f.visit_date,
        weight_kg: f.weight_kg ? +f.weight_kg : null,
        height_cm: f.height_cm ? +f.height_cm : null,
        muac_cm: f.muac_cm ? +f.muac_cm : null,
      });
      toast({ title: "Growth visit saved" });
      setOpen(false); setF({ visit_date: format(new Date(), "yyyy-MM-dd") });
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };

  const chartData = (visits || []).map((v: any) => ({
    age: v.age_months ?? 0, weight: v.weight_kg, height: v.height_cm,
    wfa: v.wfa_z, hfa: v.hfa_z,
  }));

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Growth visits</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add visit</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Growth Measurement</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Date</Label><Input type="date" value={f.visit_date} onChange={e => setF({ ...f, visit_date: e.target.value })} /></div>
                <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={f.weight_kg || ""} onChange={e => setF({ ...f, weight_kg: e.target.value })} /></div>
                <div><Label>Height (cm)</Label><Input type="number" step="0.1" value={f.height_cm || ""} onChange={e => setF({ ...f, height_cm: e.target.value })} /></div>
                <div><Label>MUAC (cm)</Label><Input type="number" step="0.1" value={f.muac_cm || ""} onChange={e => setF({ ...f, muac_cm: e.target.value })} /></div>
              </div>
              <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {chartData.length > 1 ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="age" label={{ value: "Age (months)", position: "insideBottom", offset: -4 }} />
                <YAxis label={{ value: "Z-score", angle: -90, position: "insideLeft" }} domain={[-4, 4]} />
                <Tooltip />
                <ReferenceLine y={-2} stroke="hsl(var(--warning))" strokeDasharray="4 4" label="-2SD" />
                <ReferenceLine y={-3} stroke="hsl(var(--critical))" strokeDasharray="4 4" label="-3SD" />
                <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" />
                <Line type="monotone" dataKey="wfa" name="Weight-for-age z" stroke="hsl(var(--primary))" strokeWidth={2} />
                <Line type="monotone" dataKey="hfa" name="Height-for-age z" stroke="hsl(var(--info))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-6">At least 2 visits needed to chart growth.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Age (m)</TableHead><TableHead>Weight</TableHead><TableHead>Height</TableHead><TableHead>MUAC</TableHead><TableHead>WFA z</TableHead><TableHead>HFA z</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
            <TableBody>
              {!visits?.length ? <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">No growth visits</TableCell></TableRow> :
                visits.map((v: any) => (
                  <TableRow key={v.id}>
                    <TableCell>{format(new Date(v.visit_date), "MMM d, yyyy")}</TableCell>
                    <TableCell>{v.age_months ?? "—"}</TableCell>
                    <TableCell>{v.weight_kg ?? "—"} kg</TableCell>
                    <TableCell>{v.height_cm ?? "—"} cm</TableCell>
                    <TableCell>{v.muac_cm ?? "—"}</TableCell>
                    <TableCell>{v.wfa_z ?? "—"}</TableCell>
                    <TableCell>{v.hfa_z ?? "—"}</TableCell>
                    <TableCell><Badge variant="outline">{v.nutrition_status || "—"}</Badge></TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
