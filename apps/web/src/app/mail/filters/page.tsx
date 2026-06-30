'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@inboxctrl/ui/components/alert';
import { Badge } from '@inboxctrl/ui/components/badge';
import { Button } from '@inboxctrl/ui/components/button';
import { Card, CardContent, CardHeader, CardTitle } from '@inboxctrl/ui/components/card';
import { Textarea } from '@inboxctrl/ui/components/textarea';
import { AlertCircle, BrainCircuit, CheckCircle2, Filter, RefreshCw } from 'lucide-react';

interface ParsedFilterData {
  criteria?: Record<string, string | undefined>;
  action?: {
    addLabelIds?: string[];
    removeLabelIds?: string[];
    forward?: string;
  };
}

interface FilterResult {
  success: boolean;
  isDryRun?: boolean;
  parsedAiData?: ParsedFilterData;
  dryRunResults?: {
    totalMatched: number;
    samples: {
      id: string;
      from: string;
      subject: string;
      snippet: string | null;
    }[];
  };
  filter?: unknown;
}

const defaultPrompt = 'When newsletters or marketing emails arrive, apply my Newsletters label and skip the inbox.';

export default function FiltersPage() {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [result, setResult] = useState<FilterResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMode, setLoadingMode] = useState<'dry-run' | 'create' | null>(null);

  const submitFilter = async (dryRun: boolean) => {
    setLoadingMode(dryRun ? 'dry-run' : 'create');
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/mail/filters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, dryRun }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Filter request failed');
      }

      setResult(data.data);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : 'Filter request failed');
    } finally {
      setLoadingMode(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Filter Builder</h1>
          <p className="text-muted-foreground mt-1 max-w-2xl">
            Draft Gmail filters from natural language, run them against the local mail cache, then create the rule when
            the match looks right.
          </p>
        </div>
        <Badge variant="secondary" className="w-fit">
          OSS
        </Badge>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Could not build filter</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Alert>
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>{result.isDryRun ? 'Dry run complete' : 'Filter created'}</AlertTitle>
          <AlertDescription>
            {result.isDryRun
              ? `${result.dryRunResults?.totalMatched ?? 0} cached emails matched this draft.`
              : 'The Gmail filter was created with the parsed action.'}
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Natural-language rule
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            className="min-h-36 resize-none"
          />
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button onClick={() => submitFilter(true)} disabled={!prompt.trim() || loadingMode !== null}>
              {loadingMode === 'dry-run' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <BrainCircuit className="mr-2 h-4 w-4" />
              )}
              Dry Run
            </Button>
            <Button
              variant="outline"
              onClick={() => submitFilter(false)}
              disabled={!prompt.trim() || loadingMode !== null}
            >
              {loadingMode === 'create' ? (
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-2 h-4 w-4" />
              )}
              Create Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {result?.parsedAiData && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Criteria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {Object.entries(result.parsedAiData.criteria ?? {}).map(([key, value]) =>
                value ? (
                  <div key={key} className="flex justify-between gap-4">
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ) : null
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Action</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {(result.parsedAiData.action?.addLabelIds ?? []).length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">add labels</span>
                  <span className="font-medium">{result.parsedAiData.action?.addLabelIds?.join(', ')}</span>
                </div>
              )}
              {(result.parsedAiData.action?.removeLabelIds ?? []).length > 0 && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">remove labels</span>
                  <span className="font-medium">{result.parsedAiData.action?.removeLabelIds?.join(', ')}</span>
                </div>
              )}
              {result.parsedAiData.action?.forward && (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">forward</span>
                  <span className="font-medium">{result.parsedAiData.action.forward}</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {(result?.dryRunResults?.samples.length ?? 0) > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Matched Samples</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {result?.dryRunResults?.samples.map((email) => (
              <div key={email.id} className="border-b pb-3 last:border-0 last:pb-0">
                <div className="font-medium">{email.subject}</div>
                <div className="text-muted-foreground text-sm">{email.from}</div>
                <div className="text-muted-foreground mt-1 line-clamp-2 text-sm">{email.snippet}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
