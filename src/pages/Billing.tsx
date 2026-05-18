import { useState } from "react";
import { Plus, Search, FileText, CheckCircle, AlertCircle, Clock, Smartphone, Banknote, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useInvoices, useCreateInvoice, useUpdateInvoiceStatus, InvoiceStatus } from "@/hooks/useBilling";
import { usePayments, useInitiateMpesa, useRecordPayment } from "@/hooks/usePayments";
import { usePatients } from "@/hooks/useHospitalData";
import { useToast } from "@/components/ui/use-toast";
import { useHospital } from "@/hooks/useHospital";
import { formatMoney } from "@/lib/locale";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  paid: "bg-green-100 text-green-800",
  overdue: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
};

const paymentStatusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  processing: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-800",
  refunded: "bg-purple-100 text-purple-800",
};

export default function Billing() {
  const { data: invoices, isLoading } = useInvoices();
  const { data: patients } = usePatients();
  const { data: payments, isLoading: paymentsLoading } = usePayments();
  const createInvoice = useCreateInvoice();
  const updateStatus = useUpdateInvoiceStatus();
  const initiateMpesa = useInitiateMpesa();
  const recordPayment = useRecordPayment();
  const { toast } = useToast();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMpesaDialogOpen, setIsMpesaDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const [newInvoice, setNewInvoice] = useState({
    patient_id: "",
    amount: "",
    due_date: "",
    notes: "",
  });

  const [mpesaPayment, setMpesaPayment] = useState({
    patient_id: "",
    phone_number: "",
    amount: "",
    invoice_id: "",
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInvoice.patient_id || !newInvoice.amount || !newInvoice.due_date) return;

    try {
      await createInvoice.mutateAsync({
        patient_id: newInvoice.patient_id,
        amount: parseFloat(newInvoice.amount),
        due_date: new Date(newInvoice.due_date).toISOString(),
        notes: newInvoice.notes,
        invoice_number: `INV-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`,
        status: "pending",
      });
      setIsDialogOpen(false);
      setNewInvoice({ patient_id: "", amount: "", due_date: "", notes: "" });
      toast({ title: "Success", description: "Invoice created successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to create invoice", variant: "destructive" });
    }
  };

  const handleMpesaPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaPayment.patient_id || !mpesaPayment.phone_number || !mpesaPayment.amount) return;
    try {
      const result = await initiateMpesa.mutateAsync({
        patient_id: mpesaPayment.patient_id,
        phone_number: mpesaPayment.phone_number,
        amount: parseFloat(mpesaPayment.amount),
        invoice_id: mpesaPayment.invoice_id || undefined,
      });
      setIsMpesaDialogOpen(false);
      setMpesaPayment({ patient_id: "", phone_number: "", amount: "", invoice_id: "" });
      toast({
        title: result.demo_mode ? "M-Pesa (Demo)" : "STK Push Sent",
        description: result.demo_mode 
          ? "Running in demo mode. Configure M-Pesa API keys for live payments."
          : "Enter your M-Pesa PIN on your phone to complete payment.",
      });
    } catch {
      toast({ title: "Error", description: "Failed to initiate M-Pesa payment", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: string, status: InvoiceStatus) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast({ title: "Success", description: "Status updated successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
    }
  };

  const filteredInvoices = invoices?.filter((inv) => {
    const matchesSearch = inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (inv.patients?.first_name + " " + inv.patients?.last_name).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || inv.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalRevenue = invoices?.filter(i => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const pendingAmount = invoices?.filter(i => i.status === 'pending').reduce((sum, i) => sum + Number(i.amount), 0) || 0;
  const overdueAmount = invoices?.filter(i => i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount), 0) || 0;

  const { country, currency } = useHospital();
  const mobileMoneyLabel = country.mobileMoney[0] || "Mobile Money";

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Revenue</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and mobile money transactions.</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={isMpesaDialogOpen} onOpenChange={setIsMpesaDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline"><Smartphone className="mr-2 h-4 w-4" /> {mobileMoneyLabel} Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Initiate {mobileMoneyLabel} Payment</DialogTitle></DialogHeader>
              <form onSubmit={handleMpesaPayment} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={mpesaPayment.patient_id} onValueChange={(v) => setMpesaPayment({ ...mpesaPayment, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Phone Number</Label>
                  <Input value={mpesaPayment.phone_number} onChange={(e) => setMpesaPayment({ ...mpesaPayment, phone_number: e.target.value })} placeholder={`e.g. ${country.dialCode}712345678`} required />
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency})</Label>
                  <Input type="number" min="1" value={mpesaPayment.amount} onChange={(e) => setMpesaPayment({ ...mpesaPayment, amount: e.target.value })} required />
                </div>
                <Button type="submit" className="w-full" disabled={initiateMpesa.isPending}>
                  {initiateMpesa.isPending ? "Sending request..." : `Send ${mobileMoneyLabel} request`}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="mr-2 h-4 w-4" /> Create Invoice</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New Invoice</DialogTitle></DialogHeader>
              <form onSubmit={handleCreateInvoice} className="space-y-4">
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={newInvoice.patient_id} onValueChange={(v) => setNewInvoice({ ...newInvoice, patient_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                    <SelectContent>
                      {patients?.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.first_name} {p.last_name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Amount ({currency})</Label>
                  <Input type="number" min="0" step="0.01" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Due Date</Label>
                  <Input type="date" value={newInvoice.due_date} onChange={(e) => setNewInvoice({ ...newInvoice, due_date: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Input value={newInvoice.notes} onChange={(e) => setNewInvoice({ ...newInvoice, notes: e.target.value })} placeholder="Optional notes" />
                </div>
                <Button type="submit" className="w-full" disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? "Creating..." : "Create Invoice"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CheckCircle className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(totalRevenue, country.code)}</div>
            <p className="text-xs text-muted-foreground">Paid invoices</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(pendingAmount, country.code)}</div>
            <p className="text-xs text-muted-foreground">Awaiting payment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue Amount</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatMoney(overdueAmount, country.code)}</div>
            <p className="text-xs text-muted-foreground">Past due date</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="invoices">
        <TabsList>
          <TabsTrigger value="invoices">Invoices</TabsTrigger>
          <TabsTrigger value="payments">Payment History</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices">
          <Card>
            <CardHeader><CardTitle>Invoices</CardTitle></CardHeader>
            <CardContent>
              <div className="flex gap-4 mb-4">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search invoices..." className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px]"><SelectValue placeholder="Filter by status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="overdue">Overdue</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                    ) : filteredInvoices?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center">No invoices found.</TableCell></TableRow>
                    ) : (
                      filteredInvoices?.map((invoice) => (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              {invoice.invoice_number}
                            </div>
                          </TableCell>
                          <TableCell>{invoice.patients?.first_name} {invoice.patients?.last_name}</TableCell>
                          <TableCell>{formatMoney(invoice.amount, country.code)}</TableCell>
                          <TableCell>{new Date(invoice.due_date).toLocaleDateString()}</TableCell>
                          <TableCell>
                            <Badge className={statusColors[invoice.status]} variant="outline">
                              {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Select value={invoice.status} onValueChange={(v) => handleStatusChange(invoice.id, v as InvoiceStatus)}>
                              <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="paid">Paid</SelectItem>
                                <SelectItem value="overdue">Overdue</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader><CardTitle>Payment Transactions</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Patient</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paymentsLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center">Loading...</TableCell></TableRow>
                    ) : payments?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center">No payments recorded.</TableCell></TableRow>
                    ) : (
                      payments?.map((payment: any) => (
                        <TableRow key={payment.id}>
                          <TableCell>{payment.patients?.first_name} {payment.patients?.last_name}</TableCell>
                          <TableCell>{formatMoney(payment.amount, country.code)}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              {payment.payment_method === "mpesa" && <Smartphone className="h-3 w-3" />}
                              {payment.payment_method === "cash" && <Banknote className="h-3 w-3" />}
                              {payment.payment_method === "card" && <CreditCard className="h-3 w-3" />}
                              <span className="capitalize">{payment.payment_method}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={paymentStatusColors[payment.payment_status] || ""} variant="outline">
                              {payment.payment_status.charAt(0).toUpperCase() + payment.payment_status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {payment.mpesa_receipt_number || payment.transaction_reference || "—"}
                          </TableCell>
                          <TableCell>{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
