import { NextRequest, NextResponse } from 'next/server';
import { createDonationSubmission, listDonationSubmissions } from '@/lib/db/donation-submissions';
import { verifyAccessToken } from '@/lib/auth/jwt';
import { authenticateAdmin, authenticateAdminSession } from '@/lib/middleware/admin-auth';
import { ObjectId } from 'mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, amount, currency, method, trx_id, agent, contact, notes } = body;

    let userId: ObjectId | undefined = undefined;
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    if (token) {
      const payload = verifyAccessToken(token);
      if (payload?.sub) userId = new ObjectId(payload.sub);
    }

    if (!date || !amount || !currency || !method) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const doc = await createDonationSubmission({
      user_id: userId,
      date: new Date(date),
      amount: Number(amount),
      currency,
      method,
      trx_id,
      agent,
      contact,
      notes,
    });
    return NextResponse.json({ success: true, id: doc._id?.toString() });
  } catch (e) {
    console.error('donation submission error', e);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  // Admin-only listing (support header token or session cookie)
  let ok = (await authenticateAdmin(request)).success;
  if (!ok) ok = (await authenticateAdminSession(request)).success;
  if (!ok) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { searchParams } = new URL(request.url);
  const method = searchParams.get('method') || undefined;
  const q = searchParams.get('q') || undefined;
  const limit = Number(searchParams.get('limit') || '100');
  const items = await listDonationSubmissions({ method, q, limit });
  return NextResponse.json({ data: items });
}


