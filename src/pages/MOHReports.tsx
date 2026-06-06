import { useState } from "react";
import { FileBarChart, Download, Clock, CheckCircle, Plus, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useMOHReports, useGenerateMOHReport } from "@/hooks/usePayments";
import { useSubmitDhis2 } from "@/hooks/useInterop";
import { useToast } from "@/components/ui/use-toast";

const reportTypeLabels: Record<string, string> = {
  moh_705a: "MOH 705A — Outpatient Summary (Over 5 years)",
  moh_705b: "MOH 705B — Outpatient Summary (Under 5 years)",
  moh_711: "MOH 711 — Integrated Report",
  moh_333: "MOH 333 — Maternity Register",
  moh_406: "MOH 406 — Laboratory Summary",
  moh_731: "MOH 731 — HIV Comprehensive Care",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
};

export default function MOHReports() {
  const { data: reports, isLoading } = useMOHReports();
  const generateReport = useGenerateMOHReport();
  const submitDhis2 = useSubmitDhis2();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reportType, setReportType] = useState("moh_705a");
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [selectedReport, setSelectedReport] = useState<any>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportType || !periodStart || !periodEnd) return;
    try {
      await generateReport.mutateAsync({
        report_type: reportType,
        reporting_period_start: periodStart,
        reporting_period_end: periodEnd,
      });
      setIsDialogOpen(false);
      toast({ title: "Report Generated", description: `${reportTypeLabels[reportType]} generated successfully.` });
    } catch {
      toast({ title: "Error", description: "Failed to generate report", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ministry of Health Reports</h1>
          <p className="text-muted-foreground">Generate Ministry of Health facility reports for national health information systems (DHIS2 and equivalents across East Africa).</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> Generate Report</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generate MOH Report</DialogTitle></DialogHeader>
            <form onSubmit={handleGenerate} className="space-y-4">
              <div className="space-y-2">
                <Label>Report Type</Label>
                <Select value={reportType} onValueChange={setReportType}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(reportTypeLabels).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Period Start</Label>
                  <Input type="date" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>Period End</Label>
                  <Input type="date" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={generateReport.isPending}>
                {generateReport.isPending ? "Generating..." : "Generate Report"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {Object.entries(reportTypeLabels).slice(0, 4).map(([key, label]) => {
          const count = reports?.filter((r: any) => r.report_type === key).length || 0;
          return (
            <Card key={key}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-xs font-medium truncate">{key.replace("moh_", "MOH ").toUpperCase()}</CardTitle>
                <FileBarChart className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{count}</div>
                <p className="text-xs text-muted-foreground">Reports generated</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Generated Reports</CardTitle></CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Period</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow><TableCell colSpan={4} className="text-center">Loading...</TableCell></TableRow>
                  ) : reports?.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center">No reports generated yet.</TableCell></TableRow>
                  ) : (
                    reports?.map((report: any) => (
                      <TableRow key={report.id} className="cursor-pointer" onClick={() => setSelectedReport(report)}>
                        <TableCell className="font-medium">
                          {report.report_type.replace("moh_", "MOH ").toUpperCase()}
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(report.reporting_period_start).toLocaleDateString()} — {new Date(report.reporting_period_end).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge className={statusColors[report.submission_status] || ""} variant="outline">
                            {report.submission_status.charAt(0).toUpperCase() + report.submission_status.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell className="space-x-1">
                          <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); setSelectedReport(report); }}>
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submitDhis2.isPending}
                            onClick={async (e) => {
                              e.stopPropagation();
                              try {
                                const r: any = await submitDhis2.mutateAsync(report.id);
                                toast({
                                  title: r?.succeeded ? "Submitted to DHIS2" : "DHIS2 submission incomplete",
                                  description: r?.succeeded
                                    ? `Period ${r.period} • ${r.dataValueCount} data values${r.skipped?.length ? ` • ${r.skipped.length} mappings pending` : ""}`
                                    : (r?.response?.message || "See report details"),
                                  variant: r?.succeeded ? "default" : "destructive",
                                });
                              } catch (err: any) {
                                toast({ title: "Submission failed", description: err.message, variant: "destructive" });
                              }
                            }}
                          >
                            <Send className="h-3 w-3 mr-1" />DHIS2
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Report Data Preview</CardTitle></CardHeader>
          <CardContent>
            {selectedReport ? (
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">
                    {reportTypeLabels[selectedReport.report_type] || selectedReport.report_type}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(selectedReport.reporting_period_start).toLocaleDateString()} — {new Date(selectedReport.reporting_period_end).toLocaleDateString()}
                  </p>
                </div>
                <div className="rounded-md bg-muted p-4">
                  <pre className="text-sm whitespace-pre-wrap font-mono">
                    {JSON.stringify(selectedReport.report_data, null, 2)}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-12">
                <FileBarChart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Select a report to view its data</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
