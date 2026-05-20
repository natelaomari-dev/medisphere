import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useHospital } from "@/hooks/useHospital";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Building2, User, Shield } from "lucide-react";
import { MfaSettings } from "@/components/MfaSettings";

export default function Settings() {
  const { user } = useAuth();
  const { hospitalId, userRole } = useHospital();
  const isAdmin = userRole === "admin";

  // Profile state
  const [profile, setProfile] = useState({ full_name: "", phone: "", department: "" });
  const [profileLoading, setProfileLoading] = useState(false);

  // Hospital state
  const [hospital, setHospital] = useState({ name: "", phone: "", email: "", address: "", city: "", bed_capacity: 100 });
  const [hospitalLoading, setHospitalLoading] = useState(false);

  useEffect(() => {
    if (user) {
      supabase.from("profiles").select("full_name, phone, department").eq("user_id", user.id).maybeSingle()
        .then(({ data }) => { if (data) setProfile({ full_name: data.full_name || "", phone: data.phone || "", department: data.department || "" }); });
    }
  }, [user]);

  useEffect(() => {
    if (hospitalId) {
      supabase.from("hospitals").select("name, phone, email, address, city, bed_capacity").eq("id", hospitalId).maybeSingle()
        .then(({ data }) => { if (data) setHospital({ name: data.name, phone: data.phone || "", email: data.email || "", address: data.address || "", city: data.city || "", bed_capacity: data.bed_capacity || 100 }); });
    }
  }, [hospitalId]);

  const saveProfile = async () => {
    if (!user) return;
    setProfileLoading(true);
    const { error } = await supabase.from("profiles").update(profile).eq("user_id", user.id);
    setProfileLoading(false);
    if (error) toast.error("Failed to save profile");
    else toast.success("Profile updated");
  };

  const saveHospital = async () => {
    if (!hospitalId) return;
    setHospitalLoading(true);
    const { error } = await supabase.from("hospitals").update(hospital).eq("id", hospitalId);
    setHospitalLoading(false);
    if (error) toast.error("Failed to save hospital settings");
    else toast.success("Hospital settings updated");
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground">Manage your profile and hospital configuration</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          {isAdmin && <TabsTrigger value="hospital" className="gap-1.5"><Building2 className="h-3.5 w-3.5" /> Hospital</TabsTrigger>}
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Your Profile</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Full Name</Label>
                  <Input value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="+254..." />
                </div>
                <div className="space-y-1.5">
                  <Label>Department</Label>
                  <Input value={profile.department} onChange={e => setProfile(p => ({ ...p, department: e.target.value }))} />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                </div>
              </div>
              <Button onClick={saveProfile} disabled={profileLoading} size="sm">
                {profileLoading ? "Saving..." : "Save Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="hospital">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Hospital Settings</CardTitle>
                <CardDescription>Manage your facility information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Hospital Name</Label>
                    <Input value={hospital.name} onChange={e => setHospital(h => ({ ...h, name: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Phone</Label>
                    <Input value={hospital.phone} onChange={e => setHospital(h => ({ ...h, phone: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Email</Label>
                    <Input value={hospital.email} onChange={e => setHospital(h => ({ ...h, email: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>City</Label>
                    <Input value={hospital.city} onChange={e => setHospital(h => ({ ...h, city: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <Label>Address</Label>
                    <Input value={hospital.address} onChange={e => setHospital(h => ({ ...h, address: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Bed Capacity</Label>
                    <Input type="number" value={hospital.bed_capacity} onChange={e => setHospital(h => ({ ...h, bed_capacity: parseInt(e.target.value) || 0 }))} />
                  </div>
                </div>
                <Button onClick={saveHospital} disabled={hospitalLoading} size="sm">
                  {hospitalLoading ? "Saving..." : "Save Hospital Settings"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Account</CardTitle>
              <CardDescription>Your account security overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Input value={userRole || "—"} disabled className="opacity-60 capitalize" />
              </div>
              <p className="text-xs text-muted-foreground">
                To change your password, sign out and use the forgot password flow on the login page.
              </p>
            </CardContent>
          </Card>
          <MfaSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
}
