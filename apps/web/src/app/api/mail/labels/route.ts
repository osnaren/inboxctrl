import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

import { requireGoogleAccountPermission } from '@/lib/accounts';
import { auth } from '@/lib/auth';
import { getErrorMessage } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { DBService } from '@/lib/services/db.service';
import { GmailService } from '@/lib/services/gmail.service';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const db = new DBService();
    const labels = await db.getUserLabels(session.user.id);

    return NextResponse.json({ labels });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to fetch labels', details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { name, backgroundColor, textColor } = await req.json();
    if (!name) return NextResponse.json({ error: 'Missing label name' }, { status: 400 });

    if (!session?.user?.id) return new Response('Unauthorized', { status: 401 });
    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'settings-filter');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const newRemoteLabel = await gmailService.createLabel(name, backgroundColor, textColor);

    if (newRemoteLabel.id && newRemoteLabel.name) {
      const savedLabel = await prisma.label.create({
        data: {
          gmailId: newRemoteLabel.id,
          userId: session.user.id,
          name: newRemoteLabel.name,
          type: 'user',
          color: backgroundColor || null,
        },
      });
      return NextResponse.json({ label: savedLabel });
    }

    return NextResponse.json({ error: 'Failed to create label remotely' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to create label', details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'Missing label id' }, { status: 400 });

    const label = await prisma.label.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 });

    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'settings-filter');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    await gmailService.deleteLabel(label.gmailId);

    await prisma.label.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to delete label', details: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const requestHeaders = await headers();
    const session = await auth.api.getSession({ headers: requestHeaders });
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, name, backgroundColor, textColor } = await req.json();
    if (!id || !name) return NextResponse.json({ error: 'Missing label id or name' }, { status: 400 });

    const label = await prisma.label.findUnique({
      where: { id, userId: session.user.id },
    });

    if (!label) return NextResponse.json({ error: 'Label not found' }, { status: 404 });

    const permission = await requireGoogleAccountPermission(session.user.id, requestHeaders, 'settings-filter');
    if (!permission.ok) return NextResponse.json(permission.body, { status: permission.status });

    const gmailService = new GmailService(permission.accessToken);
    const updatedRemoteLabel = await gmailService.updateLabel(label.gmailId, name, backgroundColor, textColor);

    if (updatedRemoteLabel.id && updatedRemoteLabel.name) {
      const updatedLabel = await prisma.label.update({
        where: { id },
        data: {
          name: updatedRemoteLabel.name,
          color: backgroundColor || null,
        },
      });
      return NextResponse.json({ label: updatedLabel });
    }

    return NextResponse.json({ error: 'Failed to update label remotely' }, { status: 500 });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'Failed to update label', details: getErrorMessage(error) }, { status: 500 });
  }
}
