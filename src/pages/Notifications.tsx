import { useState } from "react";
import { useNotificationQueue, useTriggerDispatch, useMessagingConfig, useSaveMessagingConfig } from "@/hooks/useNotifications";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, RefreshCw, MessageSquare, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const statusColor: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  sending: "bg-warning/15 text-warning",
  sent: "bg-primary/15 text-primary",
  delivered: "bg-success/15 text-success",
  failed: "bg-destructive/15 text-destructive",
};

const channelIcon = { sms: Phone, whatsapp: MessageSquare, email: Mail } as const;

export default function Notifications() {
  const { data: rows = [], isLoading, refetch } = useNotificationQueue();
  const dispatch = useTriggerDispatch();
  const { data: cfg } = useMessagingConfig();
  const save = useSaveMessagingConfig();
  const [form, setForm] = useState<any>(null);
  const current = form || cfg || { sms_provider: "africastalking", whatsapp_provider: "twilio" };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-muted-foreground">SMS & WhatsApp queue, delivery status, and provider config.</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => refetch()}><RefreshCw className="h-3.5 w-3.5 mr-1" /> Refresh</Button>
          <Button size="sm" onClick={() => dispatch.mutate(undefined, { onSuccess: (d) => toast.success(`Processed ${(d as any)?.processed || 0} messages`) })} disabled={dispatch.isPending}>
            <Send className="h-3.5 w-3.5 mr-1" /> Dispatch now
          </Button>
        </div>
      </div>

      <Tabs defaultValue="queue">
        <TabsList>
          <TabsTrigger value="queue">Queue</TabsTrigger>
          <TabsTrigger value="config">Provider config</TabsTrigger>
        </TabsList>

        <TabsContent value="queue">
          <Card>
            <CardHeader><CardTitle className="text-base">Outbound messages</CardTitle></CardHeader>
            <CardContent>
              {isLoading ? <p className="text-sm text-muted-foreground">Loading…</p>
                : rows.length === 0 ? <p className="text-sm text-muted-foreground">No messages yet.</p>
                : (
                <div className="space-y-1.5">
                  {rows.map((r: any) => {
                    const Icon = channelIcon[r.channel as keyof typeof channelIcon] || MessageSquare;
                    return (
                      <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card">
                        <Icon className="h-4 w-4 mt-1 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium">{r.template_key}</span>
                            <Badge className={statusColor[r.status] || ""}>{r.status}</Badge>
                            <span className="text-xs text-muted-foreground">{r.recipient}</span>
                          </div>
                          {r.rendered_body && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.rendered_body}</p>}
                          {r.error_message && <p className="text-xs text-destructive mt-1">{r.error_message}</p>}
                          <p className="text-[10px] text-muted-foreground mt-1">
                            Scheduled {new Date(r.scheduled_for).toLocaleString()}
                            {r.delivered_at && ` · Delivered ${new Date(r.delivered_at).toLocaleString()}`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Messaging providers</CardTitle>
              <CardDescription>SMS uses Africa's Talking (platform-level). WhatsApp can be Twilio or Meta per hospital.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>SMS sender ID</Label>
                  <Input value={current.sms_sender_id || ""} onChange={e => setForm({ ...current, sms_sender_id: e.target.value })} placeholder="MEDISPHERE" />
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp provider</Label>
                  <Select value={current.whatsapp_provider} onValueChange={v => setForm({ ...current, whatsapp_provider: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="meta">Meta WhatsApp Business</SelectItem>
                      <SelectItem value="none">Disabled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>WhatsApp from number</Label>
                  <Input value={current.whatsapp_from || ""} onChange={e => setForm({ ...current, whatsapp_from: e.target.value })} placeholder="+14155238886" />
                </div>
                {current.whatsapp_provider === "twilio" ? (
                  <>
                    <div className="space-y-1.5">
                      <Label>Twilio Account SID — secret name</Label>
                      <Input value={current.twilio_account_sid_secret_id || ""} onChange={e => setForm({ ...current, twilio_account_sid_secret_id: e.target.value })} placeholder="TWILIO_SID_HOSPITAL_X" />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Twilio Auth Token — secret name</Label>
                      <Input value={current.twilio_auth_token_secret_id || ""} onChange={e => setForm({ ...current, twilio_auth_token_secret_id: e.target.value })} placeholder="TWILIO_TOKEN_HOSPITAL_X" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <Label>Meta phone number ID</Label>
                      <Input value={current.meta_phone_number_id || ""} onChange={e => setForm({ ...current, meta_phone_number_id: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Meta access token — secret name</Label>
                      <Input value={current.meta_access_token_secret_id || ""} onChange={e => setForm({ ...current, meta_access_token_secret_id: e.target.value })} placeholder="META_TOKEN_HOSPITAL_X" />
                    </div>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Provider credentials are stored as platform secrets and referenced here by name. Ask your administrator to add the secrets in Project Settings.
              </p>
              <Button size="sm" onClick={() => save.mutate(current, { onSuccess: () => { toast.success("Saved"); setForm(null); } })} disabled={save.isPending}>
                Save provider config
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
