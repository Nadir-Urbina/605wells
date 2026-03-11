import { NextRequest, NextResponse } from 'next/server';
import { verifyTeamMemberSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { client } from '@/lib/sanity';

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

    // Fetch team member details from Sanity
    const teamMember = await client.fetch(
      `*[_type == "teamMember" && _id == $teamMemberId][0] {
        _id,
        firstName,
        lastName,
        email,
        avatar,
        bio,
        role,
        ministryTypes[]-> {
          _id,
          title,
          slug
        }
      }`,
      { teamMemberId: session.sanityTeamMemberId }
    );

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      teamMember,
    });
  } catch (error) {
    console.error('Error fetching team member profile:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch profile',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
