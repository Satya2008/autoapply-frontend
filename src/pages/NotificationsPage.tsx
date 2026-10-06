import { Bell, Send } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { me } from '@/api/endpoints';
import type { NotificationPreferences, TelegramLink } from '@/api/types';
import { CopyButton } from '@/components/ui/editors';
import { Badge, Button, Card, ErrorBox, Notice, PageHeader, Spinner, Toggle } from '@/components/ui/primitives';
import { useToast } from '@/components/ui/toast';
import { dateTime } from '@/lib/format';

type Editable = Omit<NotificationPreferences, 'telegramLinked'>;

export default function NotificationsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const prefs = useQuery({ queryKey: ['notification-preferences'], queryFn: me.notificationPreferences });
  const [form, setForm] = useState<Editable | null>(null);
  const [link, setLink] = useState<TelegramLink | null>(null);

  useEffect(() => {
    if (prefs.data) {
      const { telegramLinked: _linked, ...rest } = prefs.data;
      setForm(rest);
    }
  }, [prefs.data]);

  const save = useMutation({
    mutationFn: (next: Editable) => me.updateNotificationPreferences(next),
    onSuccess: (saved) => {
      queryClient.setQueryData(['notification-preferences'], saved);
      toast.success('Saved');
    },
    onError: (e) => {
      toast.error('Not saved', e);
      void prefs.refetch();
    },
  });
  const linkTelegram = useMutation({ mutationFn: me.telegramLink, onSuccess: setLink });

  const change = (patch: Partial<Editable>) => {
    if (!form) {
      return;
    }
    const next = { ...form, ...patch };
    setForm(next);
    save.mutate(next);
  };

  return (
    <div className="space-y-5">
      <PageHeader icon={<Bell />} title="Notifications" subtitle="How NaukriRadar tells you what happened: a daily digest with real numbers, and a message after each apply run." />
      {prefs.error ? <ErrorBox error={prefs.error} /> : null}
      {prefs.isLoading || !form ? (
        <Spinner />
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          <Card title="Channels">
            <div className="space-y-4">
              <Toggle checked={form.emailEnabled} onChange={(v) => change({ emailEnabled: v })} label="Email" description="To the email you signed in with." />
              <Toggle
                checked={form.telegramEnabled}
                onChange={(v) => change({ telegramEnabled: v })}
                disabled={!prefs.data?.telegramLinked}
                label={
                  <span className="inline-flex items-center gap-2">
                    Telegram {prefs.data?.telegramLinked ? <Badge tone="green">linked</Badge> : <Badge>not linked</Badge>}
                  </span>
                }
                description={prefs.data?.telegramLinked ? 'Messages go to your linked chat.' : 'Link your chat first (on the right).'}
              />
            </div>
          </Card>
          <Card title="What to send">
            <div className="space-y-4">
              <Toggle checked={form.digestEnabled} onChange={(v) => change({ digestEnabled: v })} label="Daily digest"
                description="Sent, waiting for you and new picks of the last 24 hours. Nothing new, nothing sent." />
              <Toggle checked={form.applyUpdates} onChange={(v) => change({ applyUpdates: v })} label="After each apply run"
                description="When something was sent or is waiting for you." />
            </div>
          </Card>
          <Card title="Link Telegram" className="lg:col-span-2">
            <div className="space-y-3">
              <p className="text-sm text-slate-500">
                Get a one-time code, then send it to the NaukriRadar bot. The code works once and expires in 15 minutes.
              </p>
              <Button icon={<Send className="h-4 w-4" />} loading={linkTelegram.isPending} onClick={() => linkTelegram.mutate()}>
                {prefs.data?.telegramLinked ? 'Link a different chat' : 'Get a link code'}
              </Button>
              {linkTelegram.error ? <ErrorBox error={linkTelegram.error} /> : null}
              {link && (
                <Notice tone="blue">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-mono text-2xl font-semibold tracking-widest">{link.code}</span>
                    <CopyButton text={`/start ${link.code}`} label="Copy /start command" />
                  </div>
                  <div className="mt-2 text-sm">{link.instructions}</div>
                  <div className="mt-1 text-xs opacity-75">Expires {dateTime(link.expiresAt)}</div>
                  <Button size="sm" variant="secondary" className="mt-2" onClick={() => prefs.refetch()}>
                    I sent it, check again
                  </Button>
                </Notice>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
