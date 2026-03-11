import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { client } from '@/lib/sanity';

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

    // Fetch all team members from Sanity
    const teamMembers = await client.fetch(
      `*[_type == "teamMember"] | order(firstName asc) {
        _id,
        firstName,
        lastName,
        email,
        role,
        active,
        firebaseUid,
        avatar,
        bio,
        ministryTypes[]-> {
          _id,
          title,
          slug
        }
      }`
    );

    return NextResponse.json({
      teamMembers,
    });
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch team members',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
