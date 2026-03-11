import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { createTeamMemberSession, TEAM_MEMBER_COOKIE_OPTIONS } from '@/lib/auth';
import { getTeamMemberAuth, updateLastLogin } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken) {
      return NextResponse.json(
        { error: 'ID token is required' },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!email) {
      return NextResponse.json(
        { error: 'Email not found in token' },
        { status: 400 }
      );
    }

    // Get team member auth record from Firestore
    const teamMemberAuth = await getTeamMemberAuth(firebaseUid);

    if (!teamMemberAuth) {
      return NextResponse.json(
        { error: 'Team member account not found. Please contact an administrator.' },
        { status: 404 }
      );
    }

    // Update last login timestamp
    await updateLastLogin(firebaseUid);

    // Create session cookie
    const sessionToken = createTeamMemberSession(
      firebaseUid,
      teamMemberAuth.sanityTeamMemberId,
      email
    );

    // Set cookie and return success
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
    });

    response.cookies.set(TEAM_MEMBER_COOKIE_OPTIONS.name, sessionToken, {
      maxAge: TEAM_MEMBER_COOKIE_OPTIONS.maxAge,
      httpOnly: TEAM_MEMBER_COOKIE_OPTIONS.httpOnly,
      secure: TEAM_MEMBER_COOKIE_OPTIONS.secure,
      sameSite: TEAM_MEMBER_COOKIE_OPTIONS.sameSite,
      path: TEAM_MEMBER_COOKIE_OPTIONS.path,
    });

    return response;
  } catch (error) {
    console.error('Team member login error:', error);

    // Handle specific Firebase Auth errors
    if (error instanceof Error && error.message.includes('auth/id-token-expired')) {
      return NextResponse.json(
        { error: 'Session expired. Please log in again.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      {
        error: 'Login failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
