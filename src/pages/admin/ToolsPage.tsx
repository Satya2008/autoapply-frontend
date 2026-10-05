import { CloudUpload, Mail, Send } from 'lucide-react';
import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { notifications, storage } from '@/api/endpoints';
import { useSession } from '@/app/session';
import { JsonView } from '@/components/ui/editors';
import { ConfirmButton } from '@/components/ui/overlays';
import { Button, Card, ErrorBox, Field, Input, KeyValue, Notice, PageHeader, Select } from '@/components/ui/primitives';

export default function ToolsPage() {
  const { user } = useSession();
  const migrate = useMutation({ mutationFn: storage.migrate });
  const [channel, setChannel] = useState<'EMAIL' | 'TELEGRAM'>('EMAIL');
  const [email, setEmail] = useState(user?.email ?? '');
  const [chatId, setChatId] = useState('');
  const test = useMutation({
    mutationFn: () => notifications.test(channel === 'EMAIL' ? { channel, email } : { channel, telegramChatId: chatId }),
  });

  return (
    <div className="space-y-5">
      <PageHeader title="Storage & tools" />
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title={<span className="inline-flex items-center gap-2"><CloudUpload className="h-4 w-4" /> Move files to object storage</span>}>
          <p className="mb-3 text-sm text-slate-500">
            After switching storage to S3, copies resumes from local disk into the bucket. Keys stay the same, only missing files are copied,
            nothing local is deleted, and running it again copies nothing.
          </p>
          <ConfirmButton variant="primary" size="md" title="Copy local files to S3?" message="Safe to run more than once." loading={migrate.isPending} onConfirm={() => migrate.mutate()}>
            Copy to S3
          </ConfirmButton>
          {migrate.error ? <div className="mt-3"><ErrorBox error={migrate.error} /></div> : null}
          {migrate.data && (
            <div className="mt-3">
              <KeyValue items={[['Files', migrate.data.files], ['Copied', migrate.data.copied], ['Already there', migrate.data.alreadyThere], ['Missing locally', migrate.data.missingLocally]]} />
            </div>
          )}
        </Card>

        <Card title={<span className="inline-flex items-center gap-2"><Mail className="h-4 w-4" /> Send a test notification</span>}>
          <div className="space-y-3">
            <p className="text-sm text-slate-500">Checks the SMTP or Telegram setup of notification-service right now.</p>
            <Field label="Channel">
              <Select value={channel} onChange={(e) => setChannel(e.target.value as 'EMAIL' | 'TELEGRAM')}>
                <option value="EMAIL">Email</option>
                <option value="TELEGRAM">Telegram</option>
              </Select>
            </Field>
            {channel === 'EMAIL' ? (
              <Field label="To"><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></Field>
            ) : (
              <Field label="Telegram chat id"><Input value={chatId} onChange={(e) => setChatId(e.target.value)} /></Field>
            )}
            <Button icon={<Send className="h-4 w-4" />} loading={test.isPending} onClick={() => test.mutate()}>Send</Button>
            {test.error ? <ErrorBox error={test.error} /> : null}
            {test.data && (
              <>
                <Notice tone="green">Sent.</Notice>
                <JsonView value={test.data} maxHeight="10rem" />
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
