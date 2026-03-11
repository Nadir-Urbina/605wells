import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getQueueEntries } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const admin = verifyAdminSession(sessionToken);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    // Fetch pending queue entries from Firestore
    const queueEntries = await getQueueEntries(['pending']);

    return NextResponse.json({
      queueEntries,
    });
  } catch (error) {
    console.error('Error fetching queue entries:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch queue entries',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
