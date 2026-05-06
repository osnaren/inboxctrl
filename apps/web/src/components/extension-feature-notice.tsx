import Link from 'next/link';

import { Puzzle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ExtensionFeatureNoticeProps {
  title: string;
  description: string;
}

export function ExtensionFeatureNotice({ title, description }: ExtensionFeatureNoticeProps) {
  return (
    <div className="mx-auto flex max-w-3xl items-center justify-center p-8">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Puzzle className="h-5 w-5" />
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
          <Button asChild variant="outline">
            <Link href="/mail">Back to inbox</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
