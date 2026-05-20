import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShieldCheck } from "lucide-react";

export function MfaChallenge({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const f = data?.totp?.find(x => x.status === "verified");
      if (!f) { setError("No verified MFA factor found."); return; }
      setFactorId(f.id);
      const { data: ch, error: cErr } = await supabase.auth.mfa.challenge({ factorId: f.id });
      if (cErr || !ch) { setError(cErr?.message || "Could not start challenge"); return; }
      setChallengeId(ch.id);
    })();
  }, []);

  const verify = async () => {
    if (!factorId || !challengeId) return;
    setVerifying(true);
    setError("");
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId, code });
    setVerifying(false);
    if (error) { setError(error.message); return; }
    onSuccess();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-foreground">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h2 className="text-base font-semibold">Two-factor required</h2>
      </div>
      <p className="text-xs text-muted-foreground">Enter the 6-digit code from your authenticator app.</p>
      <div className="space-y-1.5">
        <Label className="text-xs">Authentication code</Label>
        <Input
          autoFocus
          value={code}
          onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
          placeholder="000000"
          className="font-mono tracking-widest"
          maxLength={6}
        />
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={verify} disabled={verifying || code.length !== 6} className="flex-1">
          {verifying ? "Verifying…" : "Verify"}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}
