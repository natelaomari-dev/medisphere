import { useState } from "react";
import { Plus, Search, Shield, CheckCircle, Clock, XCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useInsuranceClaims, useCreateClaim, useUpdateClaimStatus } from "@/hooks/usePayments";
import { usePatients } from "@/hooks/useHospitalData";
import { useToast } from "@/components/ui/use-toast";

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  submitted: "bg-blue-100 text-blue-800",
  under_review: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  partially_approved: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
  paid: "bg-emerald-100 text-emerald-800",
  appealed: "bg-purple-100 text-purple-800",
};

export default function InsuranceClaims() {
  const { data: claims, isLoading } = useInsuranceClaims();
  const { data: patients } = usePatients();
  const createClaim = useCreateClaim();
  const updateStatus = useUpdateClaimStatus();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [newClaim, setNewClaim] = useState({
    patient_id: "",
    sha_member_number: "",
    diagnosis_codes: "",
    treatment_description: "",
    claim_amount: "",
  });

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClaim.patient_id || !newClaim.claim_amount || !newClaim.sha_member_number) return;

    try {
      await createClaim.mutateAsync({
        patient_id: newClaim.patient_id,
        sha_member_number: newClaim.sha_member_number,
        diagnosis_codes: newClaim.diagnosis_codes.split(",").map(c => c.trim()).filter(Boolean),
        treatment_description: newClaim.treatment_description,
        claim_amount: parseFloat(newClaim.claim_amount),
      });
      setIsDialogOpen(false);
      setNewClaim({ patient_id: "", sha_member_number: "", diagnosis_codes: "", treatment_description: "", claim_amount: "" });
      toast({ title: "Success", description: "Insurance claim created" });
    } catch {
      toast({ title: "Error", description: "Failed to create claim", variant: "destructive" });
    }
  };

  const handleSubmitClaim = async (id: string) => {
    try {
      await updateStatus.mutateAsync({ id, claim_status: "submitted" });
      toast({ title: "Submitted", description: "Claim submitted to SHA" });
    } catch {
      toast({ title: "Error", description: "Failed to submit claim", variant: "destructive" });
    }
  };

  const filtered = claims?.filter((c: any) => {
    const search = searchTerm.toLowerCase();
    const matchesSearch = c.claim_number?.toLowerCase().includes(search) ||
      (c.patients?.first_name + " " + c.patients?.last_name).toLowerCase().includes(search);
    const matchesStatus = statusFilter === "all" || c.claim_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalClaims = claims?.reduce((s: number, c: any) => s + Number(c.claim_amount), 0) || 0;
  const approvedTotal = claims?.filter((c: any) => ["approved", "partially_approved", "paid"].includes(c.claim_status))
    .reduce((s: number, c: any) => s + Number(c.approved_amount || c.claim_amount), 0) || 0;
  const pendingCount = claims?.filter((c: any) => ["draft", "submitted", "under_review"].includes(c.claim_status)).length || 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">SHA Insurance Claims</h1>
          <p className="text-muted-foreground">Manage Social Health Authority insurance claim submissions and tracking.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Claim</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Create Insurance Claim</DialogTitle></DialogHeader>
            <form onSubmit={handleCreateClaim} className="space-y-4">
              <div className="space-y-2">
                <Label>Patient</Label>
                <Select value={newClaim.patient_id} onValueChange={(v) => setNewClaim({ ...newClaim, patient_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                  <SelectContent>
                    {patients?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name} ({p.patient_id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>SHA Member Number</Label>
                <Input value={newClaim.sha_member_number} onChange={(e) => setNewClaim({ ...newClaim, sha_member_number: e.target.value })} placeholder="e.g., SHA-12345678" required />
              </div>
              <div className="space-y-2">
                <Label>ICD-10 Diagnosis Codes (comma-separated)</Label>
                <Input value={newClaim.diagnosis_codes} onChange={(e) => setNewClaim({ ...newClaim, diagnosis_codes: e.target.value })} placeholder="e.g., J06.9, R50.9" />
              </div>
              <div className="space-y-2">
                <Label>Treatment Description</Label>
                <Textarea value={newClaim.treatment_description} onChange={(e) => setNewClaim({ ...newClaim, treatment_description: e.target.value })} placeholder="Describe treatment provided" />
              </div>
              <div className="space-y-2">
                <Label>Claim Amount (KES)</Label>
                <Input type="number" min="0" step="0.01" value={newClaim.claim_amount} onChange={(e) => setNewClaim({ ...newClaim, claim_amount: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={createClaim.isPending}>
                {createClaim.isPending ? "Creating..." : "Create Claim"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims Value</CardTitle>
            <Shield className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {totalClaims.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Amount</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">KES {approvedTotal.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Claims</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search claims..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim #</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>SHA Member</TableHead>
                  <TableHead>Amount (KES)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={6} className="text-center">Loading claims...</TableCell></TableRow>
                ) : filtered?.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center">No claims found.</TableCell></TableRow>
                ) : (
                  filtered?.map((claim: any) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>{claim.patients?.first_name} {claim.patients?.last_name}</TableCell>
                      <TableCell>{claim.sha_member_number}</TableCell>
                      <TableCell>KES {Number(claim.claim_amount).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[claim.claim_status] || ""} variant="outline">
                          {claim.claim_status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase())}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {claim.claim_status === "draft" && (
                          <Button size="sm" variant="outline" onClick={() => handleSubmitClaim(claim.id)}>
                            <Send className="h-3 w-3 mr-1" /> Submit to SHA
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
