import { useHospital } from "@/hooks/useHospital";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, AlertTriangle, Clock, Search } from "lucide-react";
import { useState } from "react";
import { format, differenceInDays } from "date-fns";

export default function Inventory() {
  const { hospitalId } = useHospital();
  const [search, setSearch] = useState("");

  const { data: medications = [] } = useQuery({
    queryKey: ["inventory", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data } = await supabase.from("medications")
        .select("*")
        .eq("hospital_id", hospitalId!)
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const filtered = medications.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.generic_name?.toLowerCase().includes(search.toLowerCase()) ||
    m.category.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = medications.filter(m => m.stock_quantity <= m.reorder_level);
  const expiringSoon = medications.filter(m => {
    if (!m.expiry_date) return false;
    return differenceInDays(new Date(m.expiry_date), new Date()) <= 90;
  });
  const outOfStock = medications.filter(m => m.stock_quantity === 0);
  const totalValue = medications.reduce((s, m) => s + (m.stock_quantity * (Number(m.unit_price) || 0)), 0);

  const getStockBadge = (med: typeof medications[0]) => {
    if (med.stock_quantity === 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (med.stock_quantity <= med.reorder_level) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">Low Stock</Badge>;
    return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">In Stock</Badge>;
  };

  const getExpiryBadge = (date: string | null) => {
    if (!date) return <span className="text-xs text-muted-foreground">—</span>;
    const days = differenceInDays(new Date(date), new Date());
    if (days < 0) return <Badge variant="destructive">Expired</Badge>;
    if (days <= 30) return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">{days}d left</Badge>;
    if (days <= 90) return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20">{days}d left</Badge>;
    return <span className="text-xs text-muted-foreground">{format(new Date(date), "MMM yyyy")}</span>;
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Inventory Management</h1>
        <p className="text-sm text-muted-foreground">Track pharmacy stock levels and expiry dates</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><Package className="h-5 w-5 text-primary" /></div>
          <div><p className="text-xs text-muted-foreground">Total Items</p><p className="text-xl font-bold text-foreground">{medications.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
          <div><p className="text-xs text-muted-foreground">Low Stock</p><p className="text-xl font-bold text-foreground">{lowStock.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-red-500/10 flex items-center justify-center"><Clock className="h-5 w-5 text-red-600" /></div>
          <div><p className="text-xs text-muted-foreground">Expiring Soon</p><p className="text-xl font-bold text-foreground">{expiringSoon.length}</p></div>
        </CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-chart-3/10 flex items-center justify-center"><Package className="h-5 w-5 text-chart-3" /></div>
          <div><p className="text-xs text-muted-foreground">Stock Value</p><p className="text-xl font-bold text-foreground">KES {totalValue.toLocaleString()}</p></div>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {(outOfStock.length > 0 || expiringSoon.length > 0) && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 space-y-1">
            {outOfStock.length > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">⚠ {outOfStock.length} item(s) are out of stock: {outOfStock.map(m => m.name).join(", ")}</p>
            )}
            {expiringSoon.length > 0 && (
              <p className="text-sm text-amber-700 dark:text-amber-400">⏰ {expiringSoon.length} item(s) expiring within 90 days</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-base">Medication Stock</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input placeholder="Search medications..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-sm" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-auto max-h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead className="text-right">Reorder At</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Expiry</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No medications found</TableCell></TableRow>
                ) : filtered.map(med => (
                  <TableRow key={med.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm text-foreground">{med.name}</p>
                        {med.generic_name && <p className="text-xs text-muted-foreground">{med.generic_name}</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm capitalize">{med.category}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{med.stock_quantity}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">{med.reorder_level}</TableCell>
                    <TableCell>{getStockBadge(med)}</TableCell>
                    <TableCell>{getExpiryBadge(med.expiry_date)}</TableCell>
                    <TableCell className="text-right text-sm">KES {Number(med.unit_price || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
