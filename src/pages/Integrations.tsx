import { useState } from "react";
import { Plug, Webhook, Shield, Plus, Power, Trash2, ExternalLink, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/components/ui/use-toast";
import { useDhis2Mapping, useUpsertDhis2Mapping, useWebhooks, useCreateWebhook, useToggleWebhook, useDeleteWebhook, useInsuranceSchemes, useUpsertScheme } from "@/hooks/useInterop";
import { claimAdapters, type ClaimAdapterType } from "@/lib/claimAdapters";

const WEBHOOK_EVENTS = [
  "patient.created", "encounter.completed", "lab.result.finalized",
  "prescription.dispensed", "patient.discharged",
];

export default function Integrations() {
  const { toast } = useToast();
  const dhis2 = useDhis2Mapping();
  const upsertDhis2 = useUpsertDhis2Mapping();
  const webhooks = useWebhooks();
  const createWh = useCreateWebhook();
  const toggleWh = useToggleWebhook();
  const deleteWh = useDeleteWebhook();
  const schemes = useInsuranceSchemes();
  const upsertScheme = useUpsertScheme();

  // DHIS2 form
  const [d2, setD2] = useState({ dhis2_org_unit_uid: "", dhis2_endpoint_url: "", dhis2_username: "", dhis2_instance_name: "" });
  const [d2Editing, setD2Editing] = useState(false);

  // Webhook dialog
  const [whOpen, setWhOpen] = useState(false);
  const [whForm, setWhForm] = useState({ name: "", target_url: "", event_types: [] as string[] });

  // Scheme dialog
  const [schemeOpen, setSchemeOpen] = useState(false);
  const [schemeForm, setSchemeForm] = useState<{ scheme_name: string; adapter_type: ClaimAdapterType; contact_email: string; contact_phone: string }>({ scheme_name: "", adapter_type: "sha", contact_email: "", contact_phone: "" });

  const mapping = dhis2.data;
  const showD2Form = d2Editing || !mapping;
  const d2Values = mapping && !d2Editing ? mapping : d2;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Connect this facility to national health information systems, payers, and external partners.</p>
      </div>

      <Tabs defaultValue="fhir" className="space-y-6">
        <TabsList>
          <TabsTrigger value="fhir"><Plug className="h-4 w-4 mr-2" />FHIR API</TabsTrigger>
          <TabsTrigger value="dhis2">DHIS2</TabsTrigger>
          <TabsTrigger value="webhooks"><Webhook className="h-4 w-4 mr-2" />Webhooks</TabsTrigger>
          <TabsTrigger value="schemes"><Shield className="h-4 w-4 mr-2" />Insurance Schemes</TabsTrigger>
          <TabsTrigger value="hl7">HL7 v2</TabsTrigger>
        </TabsList>

        {/* ============ FHIR ============ */}
        <TabsContent value="fhir">
          <Card>
            <CardHeader>
              <CardTitle>FHIR R4 Endpoint</CardTitle>
              <CardDescription>Read-only and write access to clinical resources for trusted partners. Authentication uses a hospital member's bearer token.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-md border bg-muted/30 p-4 font-mono text-xs space-y-1">
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/metadata</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/Patient/&#123;id&#125;</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/Patient?identifier=...&birthdate=YYYY-MM-DD</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/Encounter?patient=...</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/Observation?patient=...&category=vital-signs|laboratory</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/Condition?patient=...</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/MedicationRequest?patient=...</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/DiagnosticReport?patient=...</div>
                <div><Badge variant="outline">GET</Badge> /functions/v1/fhir-api/AllergyIntolerance?patient=...</div>
                <div><Badge>POST</Badge> /functions/v1/fhir-api/Patient (FHIR Patient JSON)</div>
                <div><Badge>POST</Badge> /functions/v1/fhir-api (Bundle, type=transaction)</div>
              </div>
              <p className="text-muted-foreground">All responses use <code className="text-xs">application/fhir+json</code>. Search results are wrapped in a Bundle of type <code>searchset</code>. Supports <code>_count</code>, <code>_offset</code>, <code>_sort</code>.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ DHIS2 ============ */}
        <TabsContent value="dhis2">
          <Card>
            <CardHeader>
              <CardTitle>DHIS2 Facility Mapping</CardTitle>
              <CardDescription>Submit Ministry of Health reports directly to the national DHIS2 instance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!showD2Form && mapping && (
                <div className="rounded-md border p-4 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{mapping.dhis2_instance_name || "DHIS2 Instance"}</span>
                    <Badge variant={mapping.is_active ? "default" : "secondary"}>{mapping.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="text-muted-foreground">Org Unit: <code>{mapping.dhis2_org_unit_uid}</code></div>
                  <div className="text-muted-foreground">Endpoint: {mapping.dhis2_endpoint_url}</div>
                  {mapping.last_submission_at && <div className="text-muted-foreground">Last submission: {new Date(mapping.last_submission_at).toLocaleString()}</div>}
                  <Button size="sm" variant="outline" onClick={() => { setD2({ ...mapping as any }); setD2Editing(true); }}>Edit</Button>
                </div>
              )}
              {showD2Form && (
                <form className="space-y-3" onSubmit={async (e) => {
                  e.preventDefault();
                  try { await upsertDhis2.mutateAsync(d2Values as any); setD2Editing(false); toast({ title: "DHIS2 mapping saved" }); }
                  catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
                }}>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Instance name</Label><Input value={d2Values.dhis2_instance_name || ""} onChange={(e) => setD2({ ...d2, dhis2_instance_name: e.target.value })} placeholder="Kenya HIS" /></div>
                    <div className="space-y-1"><Label>Org Unit UID *</Label><Input required value={d2Values.dhis2_org_unit_uid} onChange={(e) => setD2({ ...d2, dhis2_org_unit_uid: e.target.value })} placeholder="DiszpKrYNg8" /></div>
                  </div>
                  <div className="space-y-1"><Label>Endpoint URL *</Label><Input required value={d2Values.dhis2_endpoint_url} onChange={(e) => setD2({ ...d2, dhis2_endpoint_url: e.target.value })} placeholder="https://hiskenya.org" /></div>
                  <div className="space-y-1"><Label>Username</Label><Input value={d2Values.dhis2_username || ""} onChange={(e) => setD2({ ...d2, dhis2_username: e.target.value })} /></div>
                  <p className="text-xs text-muted-foreground">DHIS2 passwords are stored in encrypted vault — contact platform admin to set the password secret after saving this mapping.</p>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={upsertDhis2.isPending}>Save</Button>
                    {mapping && <Button type="button" variant="ghost" onClick={() => setD2Editing(false)}>Cancel</Button>}
                  </div>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Webhooks ============ */}
        <TabsContent value="webhooks">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Outbound Webhooks</CardTitle>
                <CardDescription>HMAC-SHA256 signed events delivered to your endpoints.</CardDescription>
              </div>
              <Dialog open={whOpen} onOpenChange={setWhOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add webhook</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New webhook</DialogTitle></DialogHeader>
                  <form className="space-y-3" onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      await createWh.mutateAsync(whForm);
                      setWhOpen(false); setWhForm({ name: "", target_url: "", event_types: [] });
                      toast({ title: "Webhook created" });
                    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
                  }}>
                    <div className="space-y-1"><Label>Name *</Label><Input required value={whForm.name} onChange={(e) => setWhForm({ ...whForm, name: e.target.value })} placeholder="Data warehouse" /></div>
                    <div className="space-y-1"><Label>Target URL *</Label><Input required type="url" value={whForm.target_url} onChange={(e) => setWhForm({ ...whForm, target_url: e.target.value })} placeholder="https://example.com/webhooks/lovable" /></div>
                    <div className="space-y-2">
                      <Label>Events</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {WEBHOOK_EVENTS.map((ev) => (
                          <label key={ev} className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={whForm.event_types.includes(ev)} onChange={(e) => setWhForm({ ...whForm, event_types: e.target.checked ? [...whForm.event_types, ev] : whForm.event_types.filter((x) => x !== ev) })} />
                            <code className="text-xs">{ev}</code>
                          </label>
                        ))}
                      </div>
                    </div>
                    <Button type="submit" disabled={createWh.isPending} className="w-full">Create</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>URL</TableHead><TableHead>Events</TableHead><TableHead>Status</TableHead><TableHead>Secret</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {webhooks.data?.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No webhooks configured.</TableCell></TableRow>}
                  {webhooks.data?.map((w: any) => (
                    <TableRow key={w.id}>
                      <TableCell className="font-medium">{w.name}</TableCell>
                      <TableCell className="text-xs font-mono">{w.target_url}</TableCell>
                      <TableCell><div className="flex flex-wrap gap-1">{w.event_types.map((e: string) => <Badge key={e} variant="outline" className="text-[10px]">{e}</Badge>)}</div></TableCell>
                      <TableCell><Switch checked={w.is_active} onCheckedChange={(v) => toggleWh.mutate({ id: w.id, is_active: v })} /></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => { navigator.clipboard.writeText(w.secret); toast({ title: "Secret copied" }); }}><Copy className="h-3 w-3" /></Button></TableCell>
                      <TableCell><Button size="sm" variant="ghost" onClick={() => { if (confirm("Delete webhook?")) deleteWh.mutate(w.id); }}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <p className="mt-4 text-xs text-muted-foreground">Each delivery is signed with header <code>X-Lovable-Signature: sha256=...</code>. Verify by HMAC-SHA256(secret, raw body).</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ Insurance schemes ============ */}
        <TabsContent value="schemes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Insurance Schemes & Claim Adapters</CardTitle>
                <CardDescription>Configure payers and the export format used when generating claim batches.</CardDescription>
              </div>
              <Dialog open={schemeOpen} onOpenChange={setSchemeOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-2" />Add scheme</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>New insurance scheme</DialogTitle></DialogHeader>
                  <form className="space-y-3" onSubmit={async (e) => {
                    e.preventDefault();
                    try { await upsertScheme.mutateAsync(schemeForm); setSchemeOpen(false); setSchemeForm({ scheme_name: "", adapter_type: "sha", contact_email: "", contact_phone: "" }); toast({ title: "Scheme saved" }); }
                    catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
                  }}>
                    <div className="space-y-1"><Label>Scheme name *</Label><Input required value={schemeForm.scheme_name} onChange={(e) => setSchemeForm({ ...schemeForm, scheme_name: e.target.value })} placeholder="SHA Primary" /></div>
                    <div className="space-y-1">
                      <Label>Adapter / Export format *</Label>
                      <Select value={schemeForm.adapter_type} onValueChange={(v) => setSchemeForm({ ...schemeForm, adapter_type: v as ClaimAdapterType })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{Object.values(claimAdapters).map((a) => <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1"><Label>Contact email</Label><Input type="email" value={schemeForm.contact_email} onChange={(e) => setSchemeForm({ ...schemeForm, contact_email: e.target.value })} /></div>
                      <div className="space-y-1"><Label>Contact phone</Label><Input value={schemeForm.contact_phone} onChange={(e) => setSchemeForm({ ...schemeForm, contact_phone: e.target.value })} /></div>
                    </div>
                    <Button type="submit" disabled={upsertScheme.isPending} className="w-full">Save scheme</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Scheme</TableHead><TableHead>Adapter</TableHead><TableHead>Contact</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {schemes.data?.length === 0 && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No schemes yet.</TableCell></TableRow>}
                  {schemes.data?.map((s: any) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.scheme_name}</TableCell>
                      <TableCell><Badge variant="outline">{claimAdapters[s.adapter_type as ClaimAdapterType]?.label || s.adapter_type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{s.contact_email || s.contact_phone || "—"}</TableCell>
                      <TableCell>{s.is_active ? <Badge>Active</Badge> : <Badge variant="secondary">Inactive</Badge>}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ============ HL7 v2 ============ */}
        <TabsContent value="hl7">
          <Card>
            <CardHeader>
              <CardTitle>HL7 v2 Inbound Lab Results</CardTitle>
              <CardDescription>Reference labs can stream ORU^R01 results into this facility.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="rounded-md border bg-muted/30 p-4 font-mono text-xs">
                <div><Badge>POST</Badge> /functions/v1/hl7-inbound</div>
                <div className="mt-2">Headers: <code>X-HL7-Hospital: &lt;hospital_id&gt;</code>, <code>X-HL7-Secret: &lt;hl7-inbound webhook secret&gt;</code></div>
                <div>Content-Type: <code>application/hl7-v2</code> or text/plain</div>
                <div>Body: raw HL7 v2 ORU^R01 message</div>
              </div>
              <p className="text-muted-foreground">
                To enable: add a webhook on the Webhooks tab named <code>hl7-inbound</code> (any events) and share the generated secret with your reference lab.
                OBX segments are parsed and matched to existing lab orders by placer ID or LOINC code.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
