import { NextRequest, NextResponse } from 'next/server';
import { verifyTeamMemberSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getBookingsByTeamMember } from '@/lib/firestore-admin';

export async function GET(request: NextRequest) {
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

    // Fetch bookings for this team member
    const sessions = await getBookingsByTeamMember(session.sanityTeamMemberId);

    return NextResponse.json({
      sessions,
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch sessions',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
