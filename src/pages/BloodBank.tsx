import { useState } from "react";
import { useDonors, useAddDonor, useBloodUnits, useAddBloodUnit, useCrossmatches, useAddCrossmatch, useTransfusions, useAddTransfusion } from "@/hooks/useBloodBank";
import { usePatients } from "@/hooks/useHospitalData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Droplet, Plus, ShieldAlert } from "lucide-react";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

const BG = ["A", "B", "AB", "O"];
const RH = ["positive", "negative"];
const COMPONENTS = ["whole_blood", "packed_cells", "platelets", "plasma", "cryoprecipitate"];

export default function BloodBank() {
  const { data: donors = [] } = useDonors();
  const { data: units = [] } = useBloodUnits();
  const { data: xmatches = [] } = useCrossmatches();
  const { data: transfusions = [] } = useTransfusions();
  const { data: patients = [] } = usePatients();
  const addDonor = useAddDonor();
  const addUnit = useAddBloodUnit();
  const addX = useAddCrossmatch();
  const addT = useAddTransfusion();

  const [donorOpen, setDonorOpen] = useState(false);
  const [dForm, setDForm] = useState<any>({ donor_number: "", name: "", dob: "", sex: "M", phone: "", blood_group: "O", rh_factor: "positive", hiv_status: "pending", hepatitis_b: "pending", hepatitis_c: "pending", syphilis: "pending" });
  const [unitOpen, setUnitOpen] = useState(false);
  const [uForm, setUForm] = useState<any>({ donor_id: "", unit_number: "", blood_group: "O", rh_factor: "positive", component_type: "whole_blood", collection_date: "", expiry_date: "", volume_ml: 450 });
  const [xOpen, setXOpen] = useState(false);
  const [xForm, setXForm] = useState<any>({ patient_id: "", blood_unit_id: "", result: "compatible", notes: "" });
  const [tOpen, setTOpen] = useState(false);
  const [tForm, setTForm] = useState<any>({ patient_id: "", blood_unit_id: "", indication: "", started_at: "" });

  const available = units.filter((u: any) => u.status === "available");
  const expiringUnits = available.filter((u: any) => differenceInDays(new Date(u.expiry_date), new Date()) <= 7);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Blood Bank</h1>
          <p className="text-sm text-muted-foreground">{donors.length} donors · {available.length} units available · {expiringUnits.length} expiring ≤7d</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {BG.flatMap(g => RH.map(r => {
          const count = available.filter((u: any) => u.blood_group === g && u.rh_factor === r).length;
          return (
            <Card key={`${g}${r}`}><CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{g}{r === "positive" ? "+" : "−"}</p>
              </div>
              <Droplet className={`h-6 w-6 ${count === 0 ? "text-destructive" : "text-primary"}`} />
            </CardContent></Card>
          );
        })).slice(0, 5)}
      </div>

      <Tabs defaultValue="units">
        <TabsList>
          <TabsTrigger value="units">Units</TabsTrigger>
          <TabsTrigger value="donors">Donors</TabsTrigger>
          <TabsTrigger value="crossmatch">Crossmatch</TabsTrigger>
          <TabsTrigger value="transfusions">Transfusions</TabsTrigger>
        </TabsList>

        <TabsContent value="units">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Blood units</CardTitle>
              <Dialog open={unitOpen} onOpenChange={setUnitOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Add unit</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Add blood unit</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <div><Label>Donor</Label>
                      <Select value={uForm.donor_id} onValueChange={(v) => setUForm({ ...uForm, donor_id: v })}>
                        <SelectTrigger><SelectValue placeholder="Select donor" /></SelectTrigger>
                        <SelectContent>{donors.map((d: any) => <SelectItem key={d.id} value={d.id}>{d.donor_number} — {d.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <Input placeholder="Unit number" value={uForm.unit_number} onChange={(e) => setUForm({ ...uForm, unit_number: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={uForm.blood_group} onValueChange={(v) => setUForm({ ...uForm, blood_group: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BG.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                      <Select value={uForm.rh_factor} onValueChange={(v) => setUForm({ ...uForm, rh_factor: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RH.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <Select value={uForm.component_type} onValueChange={(v) => setUForm({ ...uForm, component_type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{COMPONENTS.map(c => <SelectItem key={c} value={c}>{c.replace("_", " ")}</SelectItem>)}</SelectContent></Select>
                    <div className="grid grid-cols-2 gap-2">
                      <div><Label>Collection</Label><Input type="date" value={uForm.collection_date} onChange={(e) => setUForm({ ...uForm, collection_date: e.target.value })} /></div>
                      <div><Label>Expiry</Label><Input type="date" value={uForm.expiry_date} onChange={(e) => setUForm({ ...uForm, expiry_date: e.target.value })} /></div>
                    </div>
                    <Input type="number" placeholder="Volume ml" value={uForm.volume_ml} onChange={(e) => setUForm({ ...uForm, volume_ml: Number(e.target.value) })} />
                  </div>
                  <DialogFooter><Button onClick={async () => { await addUnit.mutateAsync(uForm); toast.success("Unit added"); setUnitOpen(false); }}>Add</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Unit</TableHead><TableHead>Group</TableHead><TableHead>Component</TableHead><TableHead>Donor</TableHead><TableHead>Expiry</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>{units.map((u: any) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{u.unit_number}</TableCell>
                    <TableCell><Badge>{u.blood_group}{u.rh_factor === "positive" ? "+" : "−"}</Badge></TableCell>
                    <TableCell className="text-sm">{u.component_type.replace("_", " ")}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.blood_donors?.name}</TableCell>
                    <TableCell className="text-sm">{format(new Date(u.expiry_date), "MMM d")}</TableCell>
                    <TableCell><Badge variant="outline" className={u.status === "available" ? "bg-emerald-500/10 text-emerald-600" : u.status === "issued" ? "bg-sky-500/10 text-sky-600" : ""}>{u.status}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="donors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Donors</CardTitle>
              <Dialog open={donorOpen} onOpenChange={setDonorOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Register donor</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Register donor</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <Input placeholder="Donor number" value={dForm.donor_number} onChange={(e) => setDForm({ ...dForm, donor_number: e.target.value })} />
                    <Input placeholder="Full name" value={dForm.name} onChange={(e) => setDForm({ ...dForm, name: e.target.value })} />
                    <div className="grid grid-cols-2 gap-2">
                      <Input type="date" value={dForm.dob} onChange={(e) => setDForm({ ...dForm, dob: e.target.value })} />
                      <Input placeholder="Phone" value={dForm.phone} onChange={(e) => setDForm({ ...dForm, phone: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={dForm.blood_group} onValueChange={(v) => setDForm({ ...dForm, blood_group: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{BG.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}</SelectContent></Select>
                      <Select value={dForm.rh_factor} onValueChange={(v) => setDForm({ ...dForm, rh_factor: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{RH.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {(["hiv_status","hepatitis_b","hepatitis_c","syphilis"] as const).map(k => (
                        <div key={k}><Label className="text-xs">{k.replace("_", " ")}</Label>
                          <Select value={dForm[k]} onValueChange={(v) => setDForm({ ...dForm, [k]: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{["negative","positive","pending","unknown"].map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      ))}
                    </div>
                  </div>
                  <DialogFooter><Button onClick={async () => { await addDonor.mutateAsync(dForm); toast.success("Donor registered"); setDonorOpen(false); }}>Register</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Donor #</TableHead><TableHead>Name</TableHead><TableHead>Group</TableHead><TableHead>HIV</TableHead><TableHead>HBV</TableHead><TableHead>HCV</TableHead><TableHead>Syphilis</TableHead></TableRow></TableHeader>
                <TableBody>{donors.map((d: any) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-mono text-xs">{d.donor_number}</TableCell>
                    <TableCell>{d.name}</TableCell>
                    <TableCell><Badge>{d.blood_group}{d.rh_factor === "positive" ? "+" : "−"}</Badge></TableCell>
                    {(["hiv_status","hepatitis_b","hepatitis_c","syphilis"] as const).map(k => (
                      <TableCell key={k}><Badge variant="outline" className={d[k] === "negative" ? "bg-emerald-500/10 text-emerald-600" : d[k] === "positive" ? "bg-destructive/10 text-destructive" : ""}>{d[k]}</Badge></TableCell>
                    ))}
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crossmatch">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">Crossmatches</CardTitle>
              <Dialog open={xOpen} onOpenChange={setXOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Crossmatch</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Perform crossmatch</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <Select value={xForm.patient_id} onValueChange={(v) => setXForm({ ...xForm, patient_id: v })}><SelectTrigger><SelectValue placeholder="Patient" /></SelectTrigger><SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select>
                    <Select value={xForm.blood_unit_id} onValueChange={(v) => setXForm({ ...xForm, blood_unit_id: v })}><SelectTrigger><SelectValue placeholder="Blood unit" /></SelectTrigger><SelectContent>{available.map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number} ({u.blood_group}{u.rh_factor === "positive" ? "+" : "−"})</SelectItem>)}</SelectContent></Select>
                    <Select value={xForm.result} onValueChange={(v) => setXForm({ ...xForm, result: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["compatible","incompatible","pending"].map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent></Select>
                    <Textarea placeholder="Notes" rows={2} value={xForm.notes} onChange={(e) => setXForm({ ...xForm, notes: e.target.value })} />
                  </div>
                  <DialogFooter><Button onClick={async () => { await addX.mutateAsync(xForm); toast.success("Crossmatch recorded"); setXOpen(false); }}>Record</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Patient</TableHead><TableHead>Unit</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
                <TableBody>{xmatches.map((x: any) => (
                  <TableRow key={x.id}>
                    <TableCell className="text-xs">{format(new Date(x.crossmatch_date), "MMM d HH:mm")}</TableCell>
                    <TableCell className="text-sm">{x.patients?.first_name} {x.patients?.last_name}</TableCell>
                    <TableCell className="font-mono text-xs">{x.blood_units?.unit_number}</TableCell>
                    <TableCell><Badge variant="outline" className={x.result === "compatible" ? "bg-emerald-500/10 text-emerald-600" : x.result === "incompatible" ? "bg-destructive/10 text-destructive" : ""}>{x.result}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="transfusions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><ShieldAlert className="h-4 w-4" /> Transfusions</CardTitle>
              <Dialog open={tOpen} onOpenChange={setTOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-3 w-3 mr-1" /> Record</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Record transfusion</DialogTitle></DialogHeader>
                  <div className="grid gap-3">
                    <Select value={tForm.patient_id} onValueChange={(v) => setTForm({ ...tForm, patient_id: v })}><SelectTrigger><SelectValue placeholder="Patient" /></SelectTrigger><SelectContent>{patients.map((p: any) => <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>)}</SelectContent></Select>
                    <Select value={tForm.blood_unit_id} onValueChange={(v) => setTForm({ ...tForm, blood_unit_id: v })}><SelectTrigger><SelectValue placeholder="Unit (must be crossmatched)" /></SelectTrigger><SelectContent>{units.filter((u: any) => u.status === "reserved" || u.status === "available").map((u: any) => <SelectItem key={u.id} value={u.id}>{u.unit_number}</SelectItem>)}</SelectContent></Select>
                    <Input placeholder="Indication" value={tForm.indication} onChange={(e) => setTForm({ ...tForm, indication: e.target.value })} />
                    <Input type="datetime-local" value={tForm.started_at} onChange={(e) => setTForm({ ...tForm, started_at: e.target.value })} />
                  </div>
                  <DialogFooter><Button onClick={async () => { await addT.mutateAsync({ ...tForm, started_at: tForm.started_at ? new Date(tForm.started_at).toISOString() : new Date().toISOString() }); toast.success("Transfusion recorded"); setTOpen(false); }}>Record</Button></DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Patient</TableHead><TableHead>Unit</TableHead><TableHead>Started</TableHead><TableHead>Indication</TableHead><TableHead>Reactions</TableHead></TableRow></TableHeader>
                <TableBody>{transfusions.map((t: any) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-sm">{t.patients?.first_name} {t.patients?.last_name}</TableCell>
                    <TableCell className="font-mono text-xs">{t.blood_units?.unit_number}</TableCell>
                    <TableCell className="text-xs">{t.started_at ? format(new Date(t.started_at), "MMM d HH:mm") : "—"}</TableCell>
                    <TableCell className="text-sm">{t.indication}</TableCell>
                    <TableCell><Badge variant={t.reactions ? "destructive" : "outline"}>{t.reactions || "none"}</Badge></TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
