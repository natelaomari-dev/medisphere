import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useHospital } from "@/hooks/useHospital";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Users, Shield, Clock, Mail } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

const ROLE_LABELS: Record<AppRole, string> = {
  admin: "Admin",
  doctor: "Doctor",
  nurse: "Nurse",
  pharmacist: "Pharmacist",
  lab_tech: "Lab Tech",
  receptionist: "Receptionist",
};

const ROLE_COLORS: Record<AppRole, string> = {
  admin: "bg-primary/10 text-primary border-primary/20",
  doctor: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  nurse: "bg-violet-500/10 text-violet-600 border-violet-500/20",
  pharmacist: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  lab_tech: "bg-cyan-500/10 text-cyan-600 border-cyan-500/20",
  receptionist: "bg-rose-500/10 text-rose-600 border-rose-500/20",
};

function useHospitalMembers(hospitalId: string | null) {
  return useQuery({
    queryKey: ["hospital_members", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("hospital_members")
        .select("*, profiles(full_name, email:phone, avatar_url)")
        .eq("hospital_id", hospitalId!)
        .eq("is_active", true)
        .order("joined_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function usePendingInvitations(hospitalId: string | null) {
  return useQuery({
    queryKey: ["staff_invitations", hospitalId],
    enabled: !!hospitalId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("staff_invitations")
        .select("*")
        .eq("hospital_id", hospitalId!)
        .is("accepted_at", null)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

function useInviteStaff() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (invite: { email: string; role: AppRole; hospital_id: string; invited_by: string }) => {
      const { data, error } = await supabase.from("staff_invitations").insert(invite).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["staff_invitations"] }),
  });
}

function useUpdateMemberRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: AppRole }) => {
      const { error } = await supabase.from("hospital_members").update({ role }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hospital_members"] }),
  });
}

export default function StaffManagement() {
  const { hospitalId, userRole } = useHospital();
  const { user } = useAuth();
  const { data: members, isLoading: membersLoading } = useHospitalMembers(hospitalId);
  const { data: invitations, isLoading: invitesLoading } = usePendingInvitations(hospitalId);
  const inviteStaff = useInviteStaff();
  const updateRole = useUpdateMemberRole();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AppRole>("doctor");

  const isAdmin = userRole === "admin";

  const handleInvite = async () => {
    if (!inviteEmail || !hospitalId || !user) return;
    try {
      await inviteStaff.mutateAsync({
        email: inviteEmail,
        role: inviteRole,
        hospital_id: hospitalId,
        invited_by: user.id,
      });
      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail("");
      setDialogOpen(false);
    } catch {
      toast.error("Failed to send invitation");
    }
  };

  const handleRoleChange = async (memberId: string, newRole: AppRole) => {
    try {
      await updateRole.mutateAsync({ id: memberId, role: newRole });
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const roleCounts = members?.reduce((acc, m) => {
    acc[m.role] = (acc[m.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) ?? {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Staff Management</h1>
          <p className="text-sm text-muted-foreground">
            {members?.length ?? 0} active members · {invitations?.length ?? 0} pending invitations
          </p>
        </div>
        {isAdmin && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><UserPlus className="h-4 w-4" /> Invite Staff</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Invite Staff Member</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-2">
                <div className="space-y-1.5">
                  <Label>Email Address</Label>
                  <Input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="staff@hospital.com" />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                        <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInvite} disabled={inviteStaff.isPending || !inviteEmail} className="w-full mt-2">
                  {inviteStaff.isPending ? "Sending..." : "Send Invitation"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Role summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {(Object.keys(ROLE_LABELS) as AppRole[]).map((role) => (
          <Card key={role}>
            <CardContent className="p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{roleCounts[role] || 0}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{ROLE_LABELS[role]}s</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Members Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" /> Active Members
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {membersLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading members...</div>
          ) : !members?.length ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No members found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  {isAdmin && <TableHead className="w-[140px]">Change Role</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => {
                  const profile = m.profiles as any;
                  return (
                    <TableRow key={m.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                            {(profile?.full_name || "U")[0].toUpperCase()}
                          </div>
                          <span className="font-medium text-sm">{profile?.full_name || "Unknown"}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[m.role as AppRole]}>
                          {ROLE_LABELS[m.role as AppRole]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          {m.user_id === user?.id ? (
                            <span className="text-xs text-muted-foreground">You</span>
                          ) : (
                            <Select value={m.role} onValueChange={(v) => handleRoleChange(m.id, v as AppRole)}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                {(Object.keys(ROLE_LABELS) as AppRole[]).map((r) => (
                                  <SelectItem key={r} value={r}>{ROLE_LABELS[r]}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {isAdmin && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" /> Pending Invitations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {invitesLoading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">Loading...</div>
            ) : !invitations?.length ? (
              <div className="p-8 text-center text-sm text-muted-foreground">No pending invitations</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Sent</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {invitations.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="text-sm">{inv.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={ROLE_COLORS[inv.role as AppRole]}>
                          {ROLE_LABELS[inv.role as AppRole]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(inv.expires_at).toLocaleDateString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}