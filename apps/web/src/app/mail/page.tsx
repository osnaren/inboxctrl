'use client';

import { useEffect, useState } from 'react';

import { useRouter } from 'next/navigation';

import { Badge } from '@inboxctrl/ui/components/badge';
import { Button } from '@inboxctrl/ui/components/button';
import { Separator } from '@inboxctrl/ui/components/separator';
import { Archive, BrainCircuit, Reply, Trash2, MoreVertical, RefreshCw } from 'lucide-react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { authClient } from '@/lib/auth-client';

interface Email {
  id: string;
  messageId: string;
  from: string;
  subject: string;
  snippet: string;
  date: string;
  formattedDate: string;
  isUnread: boolean;
  labelIds: string[];
}

export default function MailPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);

  useEffect(() => {
    if (!isPending && !session) {
      router.push('/');
    }
  }, [isPending, session, router]);

  const fetchEmails = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/mail/list');
      if (res.ok) {
        const data = await res.json();
        setEmails(data.emails);
      }
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchEmails();
    }
  }, [session]);

  const [isTriaging, setIsTriaging] = useState(false);

  const handleTriage = async () => {
    setIsTriaging(true);
    try {
      const res = await fetch('/api/ai/triage', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        alert(`AI suggested labels for ${data.triageResults?.length || 0} emails.`);
      }
    } catch (error) {
      console.error('Triage failed:', error);
    } finally {
      setIsTriaging(false);
    }
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/mail/sync', { method: 'POST' });
      if (res.ok) {
        await fetchEmails();
      }
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isPending || !session) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Email List Pane */}
      <div className="bg-background flex w-full flex-col border-r md:w-1/2 lg:w-1/3">
        <div className="flex items-center justify-between border-b p-4">
          <h1 className="text-xl font-bold tracking-tight">Inbox</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={handleSync} disabled={isSyncing}>
              <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="sm" onClick={handleTriage} disabled={isTriaging}>
              <BrainCircuit className={`mr-2 h-4 w-4 ${isTriaging ? 'animate-pulse' : 'text-primary'}`} />
              {isTriaging ? 'Triaging...' : 'AI Triage'}
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="text-muted-foreground p-8 text-center">Loading inbox...</div>
          ) : emails.length === 0 ? (
            <div className="text-muted-foreground p-8 text-center">
              No emails found. Click sync to fetch from Gmail.
            </div>
          ) : (
            <div className="flex flex-col">
              {emails.map((email) => (
                <div
                  key={email.id}
                  onClick={() => setSelectedEmail(email)}
                  className={`flex cursor-pointer flex-col items-start gap-2 border-b p-4 transition-colors ${
                    selectedEmail?.id === email.id ? 'bg-accent/50' : 'hover:bg-muted/50'
                  } ${email.isUnread ? 'bg-muted/20' : ''}`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span
                      className={`truncate font-semibold ${email.isUnread ? 'text-foreground' : 'text-muted-foreground'}`}
                    >
                      {email.from.split('<')[0].replace(/"/g, '')}
                    </span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{email.formattedDate}</span>
                  </div>
                  <div className={`w-full truncate text-sm ${email.isUnread ? 'font-semibold' : ''}`}>
                    {email.subject}
                  </div>
                  <div className="text-muted-foreground line-clamp-2 w-full text-xs">{email.snippet}</div>
                  {email.labelIds.filter((l) => !['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'].includes(l)).length > 0 && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {email.labelIds
                        .filter((l) => !['INBOX', 'UNREAD', 'CATEGORY_PERSONAL'].includes(l))
                        .map((label) => (
                          <Badge key={label} variant="secondary" className="text-[10px]">
                            {label.replace('CATEGORY_', '')}
                          </Badge>
                        ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Email Detail Pane */}
      <div className="bg-background hidden flex-1 flex-col md:flex">
        {selectedEmail ? (
          <>
            {/* Detail Toolbar */}
            <div className="flex h-14 items-center justify-between border-b px-4">
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" title="Archive">
                  <Archive className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" title="Trash">
                  <Trash2 className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="mx-1 h-6" />
                <Button variant="outline" size="sm" className="ml-2" disabled>
                  <BrainCircuit className="text-muted-foreground mr-2 h-4 w-4" />
                  Summarize
                </Button>
                <Button variant="outline" size="sm" disabled>
                  <BrainCircuit className="text-muted-foreground mr-2 h-4 w-4" />
                  Suggest Reply
                </Button>
              </div>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>

            {/* Detail Content */}
            <ScrollArea className="flex-1 p-6">
              <div className="mx-auto max-w-3xl space-y-6">
                <div>
                  <h2 className="mb-4 text-2xl font-bold">{selectedEmail.subject}</h2>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="text-lg font-semibold">{selectedEmail.from.split('<')[0].replace(/"/g, '')}</div>
                      <div className="text-muted-foreground text-sm">{selectedEmail.from}</div>
                    </div>
                    <div className="text-muted-foreground text-sm">{selectedEmail.formattedDate}</div>
                  </div>
                </div>
                <Separator />
                <div className="space-y-4 text-base leading-relaxed">
                  <p className="text-muted-foreground italic">
                    Showing the cached snippet. Full-body AI actions are disabled in this alpha build.
                  </p>
                  <p>{selectedEmail.snippet}</p>
                </div>
                <div className="pt-8">
                  <Button>
                    <Reply className="mr-2 h-4 w-4" />
                    Reply
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4">
            <div className="bg-muted rounded-full p-4">
              <Archive className="h-8 w-8" />
            </div>
            <p>Select an email to read</p>
          </div>
        )}
      </div>
    </div>
  );
}
