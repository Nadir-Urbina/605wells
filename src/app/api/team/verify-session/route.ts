import { NextRequest, NextResponse } from 'next/server';
import { verifyTeamMemberSession, TEAM_MEMBER_COOKIE_OPTIONS } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(TEAM_MEMBER_COOKIE_OPTIONS.name)?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const teamMember = verifyTeamMemberSession(sessionToken);

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      authenticated: true,
      teamMember: {
        firebaseUid: teamMember.firebaseUid,
        sanityTeamMemberId: teamMember.sanityTeamMemberId,
        email: teamMember.email,
        role: teamMember.role,
      },
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json(
      { error: 'Session verification failed' },
      { status: 500 }
    );
  }
}
