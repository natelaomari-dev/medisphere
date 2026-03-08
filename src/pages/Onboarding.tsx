import { useState } from "react";
import { Brain, Building2, ArrowRight, Users, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHospital } from "@/hooks/useHospital";
import { toast } from "sonner";

type Step = "choice" | "create" | "invite" | "join" | "done";

export default function Onboarding() {
  const { user } = useAuth();
  const { refetch } = useHospital();
  const [step, setStep] = useState<Step>("choice");
  const [creating, setCreating] = useState(false);

  const [hospital, setHospital] = useState({
    name: "", city: "", address: "", phone: "", bed_capacity: 100,
  });

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("doctor");
  const [invites, setInvites] = useState<{ email: string; role: string }[]>([]);

  const [joinCode, setJoinCode] = useState("");

  const handleCreateHospital = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);

    const slug = hospital.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Create hospital
    const { data: hosp, error: hospErr } = await supabase
      .from("hospitals")
      .insert({
        name: hospital.name,
        slug,
        city: hospital.city,
        address: hospital.address,
        phone: hospital.phone,
        bed_capacity: hospital.bed_capacity,
        created_by: user.id,
      })
      .select()
      .single();

    if (hospErr) {
      toast.error(hospErr.message);
      setCreating(false);
      return;
    }

    // Add creator as admin member
    const { error: memberErr } = await supabase
      .from("hospital_members")
      .insert({
        hospital_id: hosp.id,
        user_id: user.id,
        role: "admin" as any,
      });

    if (memberErr) {
      toast.error(memberErr.message);
      setCreating(false);
      return;
    }

    // Update profile with hospital_id
    await supabase.from("profiles").update({ hospital_id: hosp.id }).eq("user_id", user.id);

    // Add to user_roles
    await supabase.from("user_roles").insert({ user_id: user.id, role: "admin" as any });

    setCreating(false);
    setStep("invite");
    toast.success("Hospital created!");
  };

  const handleAddInvite = () => {
    if (!inviteEmail.trim()) return;
    setInvites([...invites, { email: inviteEmail, role: inviteRole }]);
    setInviteEmail("");
  };

  const handleFinish = async () => {
    refetch();
    setStep("done");
  };

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Check for pending invitation by email
    const { data: invitation } = await supabase
      .from("staff_invitations")
      .select("*, hospitals(name)")
      .eq("email", user.email || "")
      .is("accepted_at", null)
      .limit(1)
      .single();

    if (!invitation) {
      toast.error("No invitation found for your email. Ask your hospital admin to invite you.");
      return;
    }

    // Join the hospital
    const { error } = await supabase.from("hospital_members").insert({
      hospital_id: invitation.hospital_id,
      user_id: user.id,
      role: invitation.role,
    });

    if (error) { toast.error(error.message); return; }

    // Mark invitation as accepted
    await supabase.from("staff_invitations").update({ accepted_at: new Date().toISOString() }).eq("id", invitation.id);
    await supabase.from("profiles").update({ hospital_id: invitation.hospital_id }).eq("user_id", user.id);

    toast.success(`Joined ${(invitation.hospitals as any)?.name}!`);
    refetch();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-lg">
        <div className="flex items-center gap-2.5 justify-center mb-8">
          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground tracking-tight">MediSphere AI</h1>
            <p className="text-[11px] text-muted-foreground">Hospital Setup</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "choice" && (
            <motion.div key="choice" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Welcome! Let's get you set up.</h2>
              <p className="text-sm text-muted-foreground">Are you registering a new hospital or joining an existing one?</p>

              <button onClick={() => setStep("create")} className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Register a New Hospital</p>
                  <p className="text-xs text-muted-foreground">Set up your hospital and invite staff</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>

              <button onClick={() => setStep("join")} className="w-full flex items-center gap-4 p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors text-left">
                <div className="h-10 w-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">Join Existing Hospital</p>
                  <p className="text-xs text-muted-foreground">You've been invited by a colleague</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </button>
            </motion.div>
          )}

          {step === "create" && (
            <motion.div key="create" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-1">Register Your Hospital</h2>
              <p className="text-xs text-muted-foreground mb-5">You'll be the admin of this hospital.</p>

              <form onSubmit={handleCreateHospital} className="space-y-3">
                <input type="text" placeholder="Hospital name" value={hospital.name} onChange={e => setHospital({ ...hospital, name: e.target.value })} required className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" placeholder="City" value={hospital.city} onChange={e => setHospital({ ...hospital, city: e.target.value })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                  <input type="number" placeholder="Bed capacity" value={hospital.bed_capacity} onChange={e => setHospital({ ...hospital, bed_capacity: Number(e.target.value) })} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <input type="text" placeholder="Address" value={hospital.address} onChange={e => setHospital({ ...hospital, address: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                <input type="tel" placeholder="Phone" value={hospital.phone} onChange={e => setHospital({ ...hospital, phone: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep("choice")} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Back</button>
                  <button type="submit" disabled={creating} className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {creating ? "Creating..." : "Create Hospital"}
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "invite" && (
            <motion.div key="invite" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-1">Invite Your Team</h2>
              <p className="text-xs text-muted-foreground mb-5">Add doctors, nurses, and staff. You can skip this and invite later.</p>

              <div className="flex gap-2 mb-3">
                <input type="email" placeholder="Email address" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} className="flex-1 px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary" />
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="px-3 py-2 rounded-lg bg-muted/50 border border-border text-sm text-foreground outline-none focus:ring-1 focus:ring-primary">
                  <option value="doctor">Doctor</option>
                  <option value="nurse">Nurse</option>
                  <option value="pharmacist">Pharmacist</option>
                  <option value="lab_tech">Lab Tech</option>
                  <option value="receptionist">Receptionist</option>
                  <option value="admin">Admin</option>
                </select>
                <button type="button" onClick={handleAddInvite} className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">Add</button>
              </div>

              {invites.length > 0 && (
                <div className="space-y-1.5 mb-4">
                  {invites.map((inv, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 text-sm">
                      <span className="text-foreground">{inv.email}</span>
                      <span className="text-xs text-muted-foreground capitalize">{inv.role.replace("_", " ")}</span>
                    </div>
                  ))}
                </div>
              )}

              <button onClick={handleFinish} className="w-full py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                {invites.length > 0 ? "Send Invites & Continue" : "Skip & Continue"}
              </button>
            </motion.div>
          )}

          {step === "join" && (
            <motion.div key="join" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6">
              <h2 className="text-base font-semibold text-foreground mb-1">Join Your Hospital</h2>
              <p className="text-xs text-muted-foreground mb-5">If your admin has invited you, we'll find the invitation automatically.</p>

              <form onSubmit={handleJoin} className="space-y-3">
                <p className="text-sm text-foreground">Checking invitation for: <span className="font-medium text-primary">{user?.email}</span></p>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setStep("choice")} className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted transition-colors">Back</button>
                  <button type="submit" className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
                    Find My Invitation
                  </button>
                </div>
              </form>
            </motion.div>
          )}

          {step === "done" && (
            <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="glass-card p-6 text-center">
              <div className="h-14 w-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="h-7 w-7 text-success" />
              </div>
              <h2 className="text-base font-semibold text-foreground">You're all set!</h2>
              <p className="text-sm text-muted-foreground mt-1 mb-5">Your hospital is ready. Redirecting to dashboard...</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
