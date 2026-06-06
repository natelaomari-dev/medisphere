import { useState, useRef } from "react";
import { FileText, Download, Plus, Upload, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useShaBatches, useGenerateShaBatch, useMarkBatchExported, useReconcileShaResponse, useInsuranceSchemes } from "@/hooks/useInterop";
import { downloadCSV, claimAdapters, type ClaimAdapterType } from "@/lib/claimAdapters";

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  exported: "bg-blue-100 text-blue-800",
  submitted: "bg-amber-100 text-amber-800",
  reconciled: "bg-green-100 text-green-800",
};

export default function SHAClaimsBatches() {
  const { toast } = useToast();
  const batches = useShaBatches();
  const schemes = useInsuranceSchemes();
  const generate = useGenerateShaBatch();
  const markExported = useMarkBatchExported();
  const reconcile = useReconcileShaResponse();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ period_start: "", period_end: "", scheme_id: "" as string, adapter_type: "sha" as ClaimAdapterType });
  const [reconcileBatch, setReconcileBatch] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Claim Batches</h1>
          <p className="text-muted-foreground">Generate SHA-format claim batches, export, and reconcile responses.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" />New batch</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate claim batch</DialogTitle></DialogHeader>
            <form className="space-y-3" onSubmit={async (e) => {
              e.preventDefault();
              try {
                const { batch, csv, filename } = await generate.mutateAsync({
                  period_start: form.period_start, period_end: form.period_end,
                  scheme_id: form.scheme_id || undefined, adapter_type: form.adapter_type,
                });
                downloadCSV(filename, csv);
                await markExported.mutateAsync(batch.id);
                setOpen(false); setForm({ period_start: "", period_end: "", scheme_id: "", adapter_type: "sha" });
                toast({ title: "Batch generated", description: `${batch.total_claims} claims exported.` });
              } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
            }}>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label>Period start *</Label><Input type="date" required value={form.period_start} onChange={(e) => setForm({ ...form, period_start: e.target.value })} /></div>
                <div className="space-y-1"><Label>Period end *</Label><Input type="date" required value={form.period_end} onChange={(e) => setForm({ ...form, period_end: e.target.value })} /></div>
              </div>
              <div className="space-y-1">
                <Label>Scheme</Label>
                <Select value={form.scheme_id} onValueChange={(v) => {
                  const s = schemes.data?.find((x: any) => x.id === v);
                  setForm({ ...form, scheme_id: v, adapter_type: (s?.adapter_type as ClaimAdapterType) || "sha" });
                }}>
                  <SelectTrigger><SelectValue placeholder="Any scheme (SHA default)" /></SelectTrigger>
                  <SelectContent>{schemes.data?.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.scheme_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Export format</Label>
                <Select value={form.adapter_type} onValueChange={(v) => setForm({ ...form, adapter_type: v as ClaimAdapterType })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{Object.values(claimAdapters).map((a) => <SelectItem key={a.type} value={a.type}>{a.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={generate.isPending} className="w-full">Generate & download CSV</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Batches</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Batch #</TableHead><TableHead>Period</TableHead><TableHead>Claims</TableHead><TableHead>Total</TableHead><TableHead>Approved</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
            <TableBody>
              {batches.data?.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No batches yet.</TableCell></TableRow>}
              {batches.data?.map((b: any) => (
                <TableRow key={b.id}>
                  <TableCell className="font-mono text-xs">{b.batch_number}</TableCell>
                  <TableCell className="text-sm">{b.period_start} → {b.period_end}</TableCell>
                  <TableCell>{b.total_claims}</TableCell>
                  <TableCell>KES {Number(b.total_amount).toLocaleString()}</TableCell>
                  <TableCell>{b.approved_amount != null ? `KES ${Number(b.approved_amount).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><Badge className={STATUS_COLORS[b.submission_status]} variant="outline">{b.submission_status}</Badge></TableCell>
                  <TableCell>
                    {b.submission_status !== "reconciled" && (
                      <Button size="sm" variant="outline" onClick={() => { setReconcileBatch(b.id); fileRef.current?.click(); }}>
                        <Upload className="h-3 w-3 mr-1" />Upload response
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <input
        ref={fileRef} type="file" accept=".csv" className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0]; if (!file || !reconcileBatch) return;
          const text = await file.text();
          try {
            const r = await reconcile.mutateAsync({ batch_id: reconcileBatch, csvText: text });
            toast({ title: "Reconciled", description: `${r.reconciled} claims, KES ${r.approvedTotal.toLocaleString()} approved.` });
          } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
          finally { e.target.value = ""; setReconcileBatch(null); }
        }}
      />
    </div>
  );
}
