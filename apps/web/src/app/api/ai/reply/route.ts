import { NextResponse } from 'next/server';

export function POST() {
  return NextResponse.json({ error: 'Smart reply is not enabled in this OSS alpha build.' }, { status: 501 });
}
