import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Baby, HeartPulse, Activity } from "lucide-react";
import { useHospital } from "@/hooks/useHospital";
import { usePatients } from "@/hooks/useHospitalData";
import {
  useAncVisits, useAddAncVisit,
  useDeliveries, useAddDelivery,
  usePnc, useAddPnc,
} from "@/hooks/useClinicalModules";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function MCH() {
  const { hospitalId } = useHospital();
  const { data: patients } = usePatients();
  const [patientId, setPatientId] = useState<string>("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Maternal & Child Health</h1>
        <p className="text-sm text-muted-foreground">ANC, delivery, and postnatal care registers</p>
      </div>

      <Card>
        <CardContent className="pt-4">
          <Label>Select patient (mother)</Label>
          <Select value={patientId} onValueChange={setPatientId}>
            <SelectTrigger className="max-w-md"><SelectValue placeholder="Choose patient..." /></SelectTrigger>
            <SelectContent>
              {patients?.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {patientId && (
        <Tabs defaultValue="anc">
          <TabsList>
            <TabsTrigger value="anc"><HeartPulse className="h-4 w-4 mr-2" />ANC</TabsTrigger>
            <TabsTrigger value="delivery"><Baby className="h-4 w-4 mr-2" />Deliveries</TabsTrigger>
            <TabsTrigger value="pnc"><Activity className="h-4 w-4 mr-2" />Postnatal</TabsTrigger>
          </TabsList>
          <TabsContent value="anc"><AncTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="delivery"><DeliveryTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
          <TabsContent value="pnc"><PncTab patientId={patientId} hospitalId={hospitalId} /></TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function AncTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: visits } = useAncVisits(patientId);
  const add = useAddAncVisit();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ visit_number: 1, visit_date: format(new Date(), "yyyy-MM-dd"), ifas_given: false, mosquito_net_given: false });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        gestational_age_weeks: f.gestational_age_weeks ? +f.gestational_age_weeks : null,
        weight: f.weight ? +f.weight : null,
        blood_pressure_systolic: f.blood_pressure_systolic ? +f.blood_pressure_systolic : null,
        blood_pressure_diastolic: f.blood_pressure_diastolic ? +f.blood_pressure_diastolic : null,
        fundal_height_cm: f.fundal_height_cm ? +f.fundal_height_cm : null,
        fetal_heart_rate: f.fetal_heart_rate ? +f.fetal_heart_rate : null,
        hb_level: f.hb_level ? +f.hb_level : null,
        tt_dose: f.tt_dose ? +f.tt_dose : null,
      });
      toast({ title: "ANC visit recorded" });
      setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>ANC Visits</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add visit</Button></DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>New ANC Visit</DialogTitle></DialogHeader>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Visit #</Label><Input type="number" value={f.visit_number} onChange={e => setF({ ...f, visit_number: +e.target.value })} /></div>
              <div><Label>Date</Label><Input type="date" value={f.visit_date} onChange={e => setF({ ...f, visit_date: e.target.value })} /></div>
              <div><Label>Gest. age (weeks)</Label><Input type="number" value={f.gestational_age_weeks || ""} onChange={e => setF({ ...f, gestational_age_weeks: e.target.value })} /></div>
              <div><Label>Weight (kg)</Label><Input type="number" step="0.1" value={f.weight || ""} onChange={e => setF({ ...f, weight: e.target.value })} /></div>
              <div><Label>BP Systolic</Label><Input type="number" value={f.blood_pressure_systolic || ""} onChange={e => setF({ ...f, blood_pressure_systolic: e.target.value })} /></div>
              <div><Label>BP Diastolic</Label><Input type="number" value={f.blood_pressure_diastolic || ""} onChange={e => setF({ ...f, blood_pressure_diastolic: e.target.value })} /></div>
              <div><Label>Fundal height (cm)</Label><Input type="number" value={f.fundal_height_cm || ""} onChange={e => setF({ ...f, fundal_height_cm: e.target.value })} /></div>
              <div><Label>FHR (bpm)</Label><Input type="number" value={f.fetal_heart_rate || ""} onChange={e => setF({ ...f, fetal_heart_rate: e.target.value })} /></div>
              <div><Label>Hb (g/dL)</Label><Input type="number" step="0.1" value={f.hb_level || ""} onChange={e => setF({ ...f, hb_level: e.target.value })} /></div>
              <div><Label>Urine protein</Label><Input value={f.urine_protein || ""} onChange={e => setF({ ...f, urine_protein: e.target.value })} placeholder="neg / +/++/+++" /></div>
              <div><Label>Urine glucose</Label><Input value={f.urine_glucose || ""} onChange={e => setF({ ...f, urine_glucose: e.target.value })} /></div>
              <div><Label>HIV status</Label><Input value={f.hiv_status || ""} onChange={e => setF({ ...f, hiv_status: e.target.value })} /></div>
              <div><Label>Syphilis</Label><Input value={f.syphilis_status || ""} onChange={e => setF({ ...f, syphilis_status: e.target.value })} /></div>
              <div><Label>Malaria</Label><Input value={f.malaria_status || ""} onChange={e => setF({ ...f, malaria_status: e.target.value })} /></div>
              <div><Label>TT dose #</Label><Input type="number" value={f.tt_dose || ""} onChange={e => setF({ ...f, tt_dose: e.target.value })} /></div>
              <div className="flex items-center gap-2 mt-6"><Switch checked={f.ifas_given} onCheckedChange={v => setF({ ...f, ifas_given: v })} /><Label>IFAS given</Label></div>
              <div className="flex items-center gap-2 mt-6"><Switch checked={f.mosquito_net_given} onCheckedChange={v => setF({ ...f, mosquito_net_given: v })} /><Label>Mosquito net</Label></div>
              <div><Label>Next visit</Label><Input type="date" value={f.next_visit_date || ""} onChange={e => setF({ ...f, next_visit_date: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-3">
              <div><Label>Complications</Label><Textarea value={f.complications || ""} onChange={e => setF({ ...f, complications: e.target.value })} /></div>
              <div><Label>Plan</Label><Textarea value={f.plan || ""} onChange={e => setF({ ...f, plan: e.target.value })} /></div>
            </div>
            <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">{add.isPending ? "Saving..." : "Save visit"}</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>Weeks</TableHead><TableHead>BP</TableHead><TableHead>Hb</TableHead><TableHead>FHR</TableHead><TableHead>Next</TableHead></TableRow></TableHeader>
          <TableBody>
            {!visits?.length ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No ANC visits yet</TableCell></TableRow> :
              visits.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{v.visit_number}</TableCell>
                  <TableCell>{format(new Date(v.visit_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{v.gestational_age_weeks || "—"}</TableCell>
                  <TableCell>{v.blood_pressure_systolic && v.blood_pressure_diastolic ? `${v.blood_pressure_systolic}/${v.blood_pressure_diastolic}` : "—"}</TableCell>
                  <TableCell>{v.hb_level || "—"}</TableCell>
                  <TableCell>{v.fetal_heart_rate || "—"}</TableCell>
                  <TableCell>{v.next_visit_date || "—"}</TableCell>
                </TableRow>
              ))
            }
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function DeliveryTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: deliveries } = useDeliveries(patientId);
  const add = useAddDelivery();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ delivery_date: format(new Date(), "yyyy-MM-dd"), mode: "svd", outcome: "live_birth", place: "facility" });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        gestational_age_weeks: f.gestational_age_weeks ? +f.gestational_age_weeks : null,
        apgar_1min: f.apgar_1min ? +f.apgar_1min : null,
        apgar_5min: f.apgar_5min ? +f.apgar_5min : null,
        birth_weight_g: f.birth_weight_g ? +f.birth_weight_g : null,
      });
      toast({ title: "Delivery recorded" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Deliveries</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Record delivery</Button></DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Delivery Record</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Date</Label><Input type="date" value={f.delivery_date} onChange={e => setF({ ...f, delivery_date: e.target.value })} /></div>
              <div><Label>Time</Label><Input type="time" value={f.delivery_time || ""} onChange={e => setF({ ...f, delivery_time: e.target.value })} /></div>
              <div><Label>Weeks</Label><Input type="number" value={f.gestational_age_weeks || ""} onChange={e => setF({ ...f, gestational_age_weeks: e.target.value })} /></div>
              <div>
                <Label>Mode</Label>
                <Select value={f.mode} onValueChange={v => setF({ ...f, mode: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="svd">SVD</SelectItem><SelectItem value="assisted">Assisted</SelectItem>
                    <SelectItem value="c_section_elective">Elective C/S</SelectItem><SelectItem value="c_section_emergency">Emergency C/S</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Outcome</Label>
                <Select value={f.outcome} onValueChange={v => setF({ ...f, outcome: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="live_birth">Live birth</SelectItem><SelectItem value="still_birth_fresh">Fresh SB</SelectItem><SelectItem value="still_birth_macerated">Macerated SB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sex</Label>
                <Select value={f.sex || ""} onValueChange={v => setF({ ...f, sex: v })}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="ambiguous">Ambiguous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>APGAR 1min</Label><Input type="number" max={10} value={f.apgar_1min || ""} onChange={e => setF({ ...f, apgar_1min: e.target.value })} /></div>
              <div><Label>APGAR 5min</Label><Input type="number" max={10} value={f.apgar_5min || ""} onChange={e => setF({ ...f, apgar_5min: e.target.value })} /></div>
              <div><Label>Birth weight (g)</Label><Input type="number" value={f.birth_weight_g || ""} onChange={e => setF({ ...f, birth_weight_g: e.target.value })} /></div>
              <div>
                <Label>Place</Label>
                <Select value={f.place} onValueChange={v => setF({ ...f, place: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facility">Facility</SelectItem><SelectItem value="home">Home</SelectItem><SelectItem value="en_route">En route</SelectItem><SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Textarea className="mt-3" placeholder="Complications" value={f.complications || ""} onChange={e => setF({ ...f, complications: e.target.value })} />
            <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Mode</TableHead><TableHead>Outcome</TableHead><TableHead>Sex</TableHead><TableHead>Weight</TableHead><TableHead>APGAR</TableHead><TableHead>Place</TableHead></TableRow></TableHeader>
          <TableBody>
            {!deliveries?.length ? <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-6">No deliveries yet</TableCell></TableRow> :
              deliveries.map((d: any) => (
                <TableRow key={d.id}>
                  <TableCell>{format(new Date(d.delivery_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{d.mode}</TableCell>
                  <TableCell>{d.outcome}</TableCell>
                  <TableCell>{d.sex || "—"}</TableCell>
                  <TableCell>{d.birth_weight_g ? `${d.birth_weight_g}g` : "—"}</TableCell>
                  <TableCell>{d.apgar_1min ?? "—"}/{d.apgar_5min ?? "—"}</TableCell>
                  <TableCell>{d.place}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

function PncTab({ patientId, hospitalId }: { patientId: string; hospitalId: string | null }) {
  const { data: visits } = usePnc(patientId);
  const add = useAddPnc();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState<any>({ visit_timepoint: "6_day", visit_date: format(new Date(), "yyyy-MM-dd"), family_planning_counseled: false });
  const submit = async () => {
    try {
      await add.mutateAsync({ ...f, patient_id: patientId, hospital_id: hospitalId,
        mother_bp_systolic: f.mother_bp_systolic ? +f.mother_bp_systolic : null,
        mother_bp_diastolic: f.mother_bp_diastolic ? +f.mother_bp_diastolic : null,
        mother_temperature: f.mother_temperature ? +f.mother_temperature : null,
        baby_weight_g: f.baby_weight_g ? +f.baby_weight_g : null,
        baby_temperature: f.baby_temperature ? +f.baby_temperature : null,
      });
      toast({ title: "PNC visit recorded" }); setOpen(false);
    } catch (e: any) { toast({ title: "Error", description: e.message, variant: "destructive" }); }
  };
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Postnatal Visits</CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" />Add PNC</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Postnatal Visit</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Timepoint</Label>
                <Select value={f.visit_timepoint} onValueChange={v => setF({ ...f, visit_timepoint: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6_hour">6 hours</SelectItem>
                    <SelectItem value="6_day">6 days</SelectItem>
                    <SelectItem value="6_week">6 weeks</SelectItem>
                    <SelectItem value="6_month">6 months</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Date</Label><Input type="date" value={f.visit_date} onChange={e => setF({ ...f, visit_date: e.target.value })} /></div>
              <div><Label>Mother BP sys</Label><Input type="number" value={f.mother_bp_systolic || ""} onChange={e => setF({ ...f, mother_bp_systolic: e.target.value })} /></div>
              <div><Label>Mother BP dia</Label><Input type="number" value={f.mother_bp_diastolic || ""} onChange={e => setF({ ...f, mother_bp_diastolic: e.target.value })} /></div>
              <div><Label>Mother temp</Label><Input type="number" step="0.1" value={f.mother_temperature || ""} onChange={e => setF({ ...f, mother_temperature: e.target.value })} /></div>
              <div><Label>Bleeding</Label><Input value={f.mother_bleeding || ""} onChange={e => setF({ ...f, mother_bleeding: e.target.value })} /></div>
              <div><Label>Breastfeeding</Label><Input value={f.breastfeeding_status || ""} onChange={e => setF({ ...f, breastfeeding_status: e.target.value })} /></div>
              <div><Label>Baby weight (g)</Label><Input type="number" value={f.baby_weight_g || ""} onChange={e => setF({ ...f, baby_weight_g: e.target.value })} /></div>
              <div><Label>Baby temp</Label><Input type="number" step="0.1" value={f.baby_temperature || ""} onChange={e => setF({ ...f, baby_temperature: e.target.value })} /></div>
              <div><Label>Baby feeding</Label><Input value={f.baby_feeding || ""} onChange={e => setF({ ...f, baby_feeding: e.target.value })} /></div>
              <div className="flex items-center gap-2 mt-6"><Switch checked={f.family_planning_counseled} onCheckedChange={v => setF({ ...f, family_planning_counseled: v })} /><Label>FP counseled</Label></div>
              <div><Label>FP method</Label><Input value={f.family_planning_method || ""} onChange={e => setF({ ...f, family_planning_method: e.target.value })} /></div>
            </div>
            <Textarea className="mt-3" placeholder="Complications / plan" value={f.complications || ""} onChange={e => setF({ ...f, complications: e.target.value })} />
            <Button onClick={submit} disabled={add.isPending} className="w-full mt-3">Save</Button>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader><TableRow><TableHead>Timepoint</TableHead><TableHead>Date</TableHead><TableHead>Mother BP</TableHead><TableHead>Baby weight</TableHead><TableHead>Feeding</TableHead></TableRow></TableHeader>
          <TableBody>
            {!visits?.length ? <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">No PNC visits</TableCell></TableRow> :
              visits.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{v.visit_timepoint}</TableCell>
                  <TableCell>{format(new Date(v.visit_date), "MMM d, yyyy")}</TableCell>
                  <TableCell>{v.mother_bp_systolic && v.mother_bp_diastolic ? `${v.mother_bp_systolic}/${v.mother_bp_diastolic}` : "—"}</TableCell>
                  <TableCell>{v.baby_weight_g ? `${v.baby_weight_g}g` : "—"}</TableCell>
                  <TableCell>{v.baby_feeding || "—"}</TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
