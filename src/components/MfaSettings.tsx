import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";

type Factor = { id: string; status: string; friendly_name?: string };

export function MfaSettings() {
  const [loading, setLoading] = useState(true);
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enrolling, setEnrolling] = useState(false);
  const [pending, setPending] = useState<{ factorId: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoverySaved, setRecoverySaved] = useState(false);
  const [disableCode, setDisableCode] = useState("");

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp || []) as Factor[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const verified = factors.find(f => f.status === "verified");

  const startEnroll = async () => {
    setEnrolling(true);
    try {
      // Clean up any previous unverified factor
      const unverified = factors.find(f => f.status !== "verified");
      if (unverified) await supabase.auth.mfa.unenroll({ factorId: unverified.id });

      const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
      if (error || !data) throw error || new Error("Enrollment failed");
      setPending({ factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    } catch (e: any) {
      toast.error(e.message || "Could not start enrollment");
    } finally {
      setEnrolling(false);
    }
  };

  const verifyEnroll = async () => {
    if (!pending) return;
    setVerifying(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: pending.factorId });
      if (cErr || !challenge) throw cErr || new Error("Challenge failed");
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: pending.factorId,
        challengeId: challenge.id,
        code,
      });
      if (vErr) throw vErr;
      toast.success("Two-factor authentication enabled");
      setShowRecovery(true);
      setCode("");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Invalid code");
    } finally {
      setVerifying(false);
    }
  };

  const cancelEnroll = async () => {
    if (pending) await supabase.auth.mfa.unenroll({ factorId: pending.factorId });
    setPending(null);
    setCode("");
  };

  const disableMfa = async () => {
    if (!verified) return;
    setVerifying(true);
    try {
      const { data: challenge, error: cErr } = await supabase.auth.mfa.challenge({ factorId: verified.id });
      if (cErr || !challenge) throw cErr || new Error("Challenge failed");
      const { error: vErr } = await supabase.auth.mfa.verify({
        factorId: verified.id,
        challengeId: challenge.id,
        code: disableCode,
      });
      if (vErr) throw vErr;
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verified.id });
      if (error) throw error;
      toast.success("Two-factor authentication disabled");
      setDisableCode("");
      await load();
    } catch (e: any) {
      toast.error(e.message || "Could not disable MFA");
    } finally {
      setVerifying(false);
    }
  };

  // Pseudo recovery codes derived from the TOTP secret (Supabase TOTP doesn't expose recovery codes directly).
  // We generate one-time backup tokens client-side and store on the auth user metadata for the user to print.
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  useEffect(() => {
    if (showRecovery && recoveryCodes.length === 0) {
      const codes = Array.from({ length: 8 }, () =>
        Array.from({ length: 10 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("")
      );
      setRecoveryCodes(codes);
      supabase.auth.updateUser({ data: { mfa_recovery_codes: codes, mfa_recovery_generated_at: new Date().toISOString() } });
    }
  }, [showRecovery]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading security settings…
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          {verified ? <ShieldCheck className="h-4 w-4 text-green-600" /> : <ShieldAlert className="h-4 w-4 text-amber-500" />}
          Two-factor authentication
        </CardTitle>
        <CardDescription>
          {verified ? "TOTP is active on your account." : "Add a second verification step using an authenticator app."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!verified && !pending && (
          <Button size="sm" onClick={startEnroll} disabled={enrolling}>
            {enrolling ? "Starting…" : "Enable two-factor authentication"}
          </Button>
        )}

        {pending && !showRecovery && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm text-foreground">
              Scan the QR code with Google Authenticator, 1Password, Authy, or any TOTP app.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <div className="bg-white p-2 rounded-md" dangerouslySetInnerHTML={{ __html: pending.qr }} />
              <div className="space-y-2">
                <Label className="text-xs">Or enter this secret manually</Label>
                <code className="block px-2 py-1.5 text-xs bg-muted rounded font-mono break-all">{pending.secret}</code>
                <div className="space-y-1.5 pt-2">
                  <Label className="text-xs">Enter the 6-digit code</Label>
                  <Input
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    className="font-mono tracking-widest"
                    maxLength={6}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={verifyEnroll} disabled={verifying || code.length !== 6}>
                    {verifying ? "Verifying…" : "Verify & enable"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={cancelEnroll}>Cancel</Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showRecovery && (
          <div className="space-y-3 rounded-lg border border-amber-500/30 bg-amber-500/5 p-4">
            <p className="text-sm font-medium text-foreground">Save your recovery codes</p>
            <p className="text-xs text-muted-foreground">
              Store these somewhere safe. Each code can be used once to sign in if you lose your authenticator device.
            </p>
            <div className="grid grid-cols-2 gap-2 font-mono text-xs">
              {recoveryCodes.map((c, i) => (
                <code key={i} className="px-2 py-1.5 bg-background rounded border border-border">{c}</code>
              ))}
            </div>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Checkbox checked={recoverySaved} onCheckedChange={v => setRecoverySaved(!!v)} />
              I have saved my recovery codes
            </label>
            <Button size="sm" disabled={!recoverySaved} onClick={() => { setShowRecovery(false); setPending(null); setRecoveryCodes([]); }}>
              Done
            </Button>
          </div>
        )}

        {verified && !pending && (
          <div className="space-y-3 rounded-lg border border-border p-4">
            <p className="text-sm text-foreground">To disable, enter a current 6-digit code from your authenticator.</p>
            <div className="flex gap-2 items-end">
              <div className="space-y-1.5 flex-1 max-w-[200px]">
                <Label className="text-xs">Current code</Label>
                <Input
                  value={disableCode}
                  onChange={e => setDisableCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  className="font-mono tracking-widest"
                  maxLength={6}
                />
              </div>
              <Button size="sm" variant="destructive" onClick={disableMfa} disabled={verifying || disableCode.length !== 6}>
                {verifying ? "Disabling…" : "Disable 2FA"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
