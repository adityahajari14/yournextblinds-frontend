import { NextResponse } from 'next/server';
import { verifyAdminCredentials, createAdminSession, isAdminConfigured } from '@/lib/server/admin-session';

export async function POST(request: Request) {
  if (!isAdminConfigured()) {
    return NextResponse.json(
      { success: false, error: 'Admin login is not configured.' },
      { status: 503 }
    );
  }

  let id: string, password: string;
  try {
    const body = await request.json();
    id = String(body?.id ?? '');
    password = String(body?.password ?? '');
  } catch {
    return NextResponse.json({ success: false, error: 'Invalid request.' }, { status: 400 });
  }

  if (!id || !password || !verifyAdminCredentials(id, password)) {
    return NextResponse.json({ success: false, error: 'Invalid ID or password.' }, { status: 401 });
  }

  await createAdminSession();
  return NextResponse.json({ success: true });
}
