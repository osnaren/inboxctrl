import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Email summaries are not enabled in this OSS alpha build.' }, { status: 501 });
}
