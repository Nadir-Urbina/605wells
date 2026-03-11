import { NextRequest, NextResponse } from 'next/server';
import { verifyTeamMemberSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getBooking } from '@/lib/firestore-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('team_member_session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const session = verifyTeamMemberSession(sessionToken);

    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { sessionId } = await params;

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking from Firestore
    const booking = await getBooking(sessionId);

    if (!booking) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      );
    }

    // Verify this booking belongs to the logged-in team member
    if (booking.teamMemberId !== session.sanityTeamMemberId) {
      return NextResponse.json(
        { error: 'Unauthorized access to this session' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      booking,
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch session',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
