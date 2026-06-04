import { useState } from "react";
import { useMortuaryIntakes, useAddIntake, useReleaseBody } from "@/hooks/useMortuary";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Archive } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Mortuary() {
  const { data: intakes = [] } = useMortuaryIntakes();
  const addI = useAddIntake();
  const release = useReleaseBody();

  const [iOpen, setIOpen] = useState(false);
  const [iForm, setIForm] = useState<any>({ body_id: "", deceased_name: "", deceased_sex: "M", estimated_age: "", refrigeration_unit: "", identifying_features: "", brought_in_by: "", brought_in_contact: "", police_report_number: "", post_mortem_required: false, cause_of_death: "" });
  const [rOpen, setROpen] = useState<any>(null);
  const [rForm, setRForm] = useState<any>({ released_to_name: "", released_to_id: "", released_to_relationship: "", released_to_phone: "", burial_permit_number: "" });

  const inStorage = intakes.filter((i: any) => i.status === "in_storage");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold">Mortuary</h1>
          <p className="text-sm text-muted-foreground">{inStorage.length} in storage · {intakes.length - inStorage.length} released</p>
        </div>
        <Dialog open={iOpen} onOpenChange={setIOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> New Intake</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Mortuary intake</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Body ID</Label><Input value={iForm.body_id} onChange={(e) => setIForm({ ...iForm, body_id: e.target.value })} /></div>
                <div><Label>Refrigeration unit</Label><Input value={iForm.refrigeration_unit} onChange={(e) => setIForm({ ...iForm, refrigeration_unit: e.target.value })} placeholder="R-04" /></div>
              </div>
              <div><Label>Deceased name</Label><Input value={iForm.deceased_name} onChange={(e) => setIForm({ ...iForm, deceased_name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <Select value={iForm.deceased_sex} onValueChange={(v) => setIForm({ ...iForm, deceased_sex: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="M">Male</SelectItem><SelectItem value="F">Female</SelectItem><SelectItem value="U">Unknown</SelectItem></SelectContent>
                </Select>
                <Input type="number" placeholder="Estimated age" value={iForm.estimated_age} onChange={(e) => setIForm({ ...iForm, estimated_age: e.target.value })} />
              </div>
              <div><Label>Identifying features</Label><Textarea rows={2} value={iForm.identifying_features} onChange={(e) => setIForm({ ...iForm, identifying_features: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-2">
                <Input placeholder="Brought in by" value={iForm.brought_in_by} onChange={(e) => setIForm({ ...iForm, brought_in_by: e.target.value })} />
                <Input placeholder="Contact" value={iForm.brought_in_contact} onChange={(e) => setIForm({ ...iForm, brought_in_contact: e.target.value })} />
              </div>
              <div><Label>Police report #</Label><Input value={iForm.police_report_number} onChange={(e) => setIForm({ ...iForm, police_report_number: e.target.value })} /></div>
              <div><Label>Cause of death</Label><Input value={iForm.cause_of_death} onChange={(e) => setIForm({ ...iForm, cause_of_death: e.target.value })} /></div>
              <label className="flex items-center gap-2 text-sm"><Checkbox checked={iForm.post_mortem_required} onCheckedChange={(v) => setIForm({ ...iForm, post_mortem_required: !!v })} /> Post-mortem required</label>
            </div>
            <DialogFooter><Button onClick={async () => {
              await addI.mutateAsync({ ...iForm, estimated_age: iForm.estimated_age ? Number(iForm.estimated_age) : null });
              toast.success("Intake recorded");
              setIOpen(false);
            }}>Save intake</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Body ID</TableHead><TableHead>Name</TableHead><TableHead>Sex/Age</TableHead><TableHead>Unit</TableHead><TableHead>Intake</TableHead><TableHead>Status</TableHead><TableHead /></TableRow></TableHeader>
          <TableBody>{intakes.map((i: any) => (
            <TableRow key={i.id}>
              <TableCell className="font-mono text-xs">{i.body_id}</TableCell>
              <TableCell>{i.deceased_name || "Unknown"}</TableCell>
              <TableCell className="text-sm">{i.deceased_sex} · {i.estimated_age || "?"}</TableCell>
              <TableCell className="text-sm">{i.refrigeration_unit}</TableCell>
              <TableCell className="text-xs">{format(new Date(i.intake_datetime), "MMM d HH:mm")}</TableCell>
              <TableCell><Badge variant="outline" className={i.status === "released" ? "bg-emerald-500/10 text-emerald-600" : "bg-amber-500/10 text-amber-600"}><Archive className="h-3 w-3 mr-1" />{i.status}</Badge></TableCell>
              <TableCell>{i.status === "in_storage" && <Button size="sm" variant="outline" onClick={() => setROpen(i)}>Release</Button>}</TableCell>
            </TableRow>
          ))}{intakes.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No intakes</TableCell></TableRow>}</TableBody>
        </Table>
      </CardContent></Card>

      <Dialog open={!!rOpen} onOpenChange={(o) => !o && setROpen(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Release body — {rOpen?.body_id}</DialogTitle></DialogHeader>
          <div className="grid gap-3">
            <Input placeholder="Released to (full name)" value={rForm.released_to_name} onChange={(e) => setRForm({ ...rForm, released_to_name: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="ID number" value={rForm.released_to_id} onChange={(e) => setRForm({ ...rForm, released_to_id: e.target.value })} />
              <Input placeholder="Relationship" value={rForm.released_to_relationship} onChange={(e) => setRForm({ ...rForm, released_to_relationship: e.target.value })} />
            </div>
            <Input placeholder="Phone" value={rForm.released_to_phone} onChange={(e) => setRForm({ ...rForm, released_to_phone: e.target.value })} />
            <Input placeholder="Burial permit #" value={rForm.burial_permit_number} onChange={(e) => setRForm({ ...rForm, burial_permit_number: e.target.value })} />
          </div>
          <DialogFooter><Button onClick={async () => {
            if (!rForm.released_to_name) return toast.error("Name required");
            await release.mutateAsync({ ...rForm, mortuary_intake_id: rOpen.id });
            toast.success("Body released");
            setROpen(null);
            setRForm({ released_to_name: "", released_to_id: "", released_to_relationship: "", released_to_phone: "", burial_permit_number: "" });
          }}>Confirm release</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
