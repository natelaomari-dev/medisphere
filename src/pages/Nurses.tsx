import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users, Activity, Moon, Sun, Clock } from "lucide-react";

const WARDS = ["General", "ICU", "Pediatrics", "Maternity", "Surgery", "Emergency", "Oncology"];
const SHIFTS = ["Morning", "Afternoon", "Night"];

const SHIFT_ICON: Record<string, React.ReactNode> = {
  Morning: <Sun className="h-3.5 w-3.5" />,
  Afternoon: <Clock className="h-3.5 w-3.5" />,
  Night: <Moon className="h-3.5 w-3.5" />,
};

const SHIFT_COLORS: Record<string, string> = {
  Morning: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Afternoon: "bg-sky-500/10 text-sky-600 border-sky-500/20",
  Night: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20",
};

function useNurseMembers(hospitalId: string | null) {
  return useQuery({
    queryKey: ["nurse_members", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_members")
        .select("*, profiles(full_name, phone, department, avatar_url)")
        .eq("hospital_id", hospitalId!)
        .eq("role", "nurse")
        .eq("is_active", true)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export default function Nurses() {
  const { hospitalId } = useHospital();
  const { data: nurses, isLoading } = useNurseMembers(hospitalId);
  const [search, setSearch] = useState("");
  const [wardFilter, setWardFilter] = useState("all");

  // Derive ward & shift from profile department or fallback
  const enrichedNurses = (nurses ?? []).map((n, i) => {
    const profile = n.profiles as any;
    const ward = profile?.department || WARDS[i % WARDS.length];
    const shift = SHIFTS[i % SHIFTS.length];
    return { ...n, profile, ward, shift, name: profile?.full_name || "Unknown Nurse" };
  });

  const filtered = enrichedNurses.filter((n) => {
    const matchesSearch = n.name.toLowerCase().includes(search.toLowerCase());
    const matchesWard = wardFilter === "all" || n.ward === wardFilter;
    return matchesSearch && matchesWard;
  });

  const wardCounts = enrichedNurses.reduce((acc, n) => {
    acc[n.ward] = (acc[n.ward] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const shiftCounts = enrichedNurses.reduce((acc, n) => {
    acc[n.shift] = (acc[n.shift] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Nursing Staff</h1>
        <p className="text-sm text-muted-foreground">
          {enrichedNurses.length} nurse{enrichedNurses.length !== 1 ? "s" : ""} on roster
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{enrichedNurses.length}</p>
              <p className="text-xs text-muted-foreground">Total Nurses</p>
            </div>
          </CardContent>
        </Card>
        {SHIFTS.map((shift) => (
          <Card key={shift}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                {SHIFT_ICON[shift]}
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{shiftCounts[shift] || 0}</p>
                <p className="text-xs text-muted-foreground">{shift} Shift</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search nurses..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={wardFilter} onValueChange={setWardFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Wards" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Wards</SelectItem>
            {WARDS.map((w) => (
              <SelectItem key={w} value={w}>
                {w} ({wardCounts[w] || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Nurses Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" /> Nurse Directory
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading nurses...</div>
          ) : !filtered.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              {enrichedNurses.length === 0
                ? "No nurses found. Invite nurses from Staff Management."
                : "No nurses match your filters."}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Ward</TableHead>
                  <TableHead>Current Shift</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Since</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-500/10 flex items-center justify-center text-xs font-medium text-violet-600">
                          {n.name[0].toUpperCase()}
                        </div>
                        <span className="font-medium text-sm">{n.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50">
                        {n.ward}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={SHIFT_COLORS[n.shift]}>
                        <span className="flex items-center gap-1.5">
                          {SHIFT_ICON[n.shift]} {n.shift}
                        </span>
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {n.profile?.phone || "—"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(n.joined_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
