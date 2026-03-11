import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase-admin';
import { setTeamMemberAuth } from '@/lib/firestore-admin';
import { writeClient } from '@/lib/sanity';

// Generate a random temporary password
function generateTemporaryPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}

export async function POST(request: NextRequest) {
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

    const data = await request.json();
    const {
      firstName,
      lastName,
      email,
      role,
      ministryTypes,
      bio,
      createPortalAccess,
    } = data;

    // Validate required fields
    if (!firstName || !lastName || !email || !role || !ministryTypes || ministryTypes.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    let firebaseUid: string | undefined;
    let temporaryPassword: string | undefined;

    // Create Firebase Auth account if portal access requested
    if (createPortalAccess) {
      try {
        temporaryPassword = generateTemporaryPassword();

        const userRecord = await adminAuth.createUser({
          email,
          password: temporaryPassword,
          displayName: `${firstName} ${lastName}`,
          emailVerified: false,
        });

        firebaseUid = userRecord.uid;
        console.log('✅ Firebase Auth user created:', firebaseUid);
      } catch (firebaseError: unknown) {
        console.error('Firebase Auth error:', firebaseError);
        const error = firebaseError as { code?: string; message?: string };
        if (error.code === 'auth/email-already-exists') {
          return NextResponse.json(
            { error: 'An account with this email already exists' },
            { status: 400 }
          );
        }
        throw new Error(`Failed to create Firebase user: ${error.message}`);
      }
    }

    // Create Sanity team member document
    let sanityTeamMemberId: string;
    try {
      const sanityDoc = await writeClient.create({
        _type: 'teamMember',
        firstName,
        lastName,
        email,
        role,
        ministryTypes: ministryTypes.map((id: string) => ({
          _type: 'reference',
          _ref: id,
        })),
        bio: bio || undefined,
        active: true,
        firebaseUid: firebaseUid || undefined,
      });

      sanityTeamMemberId = sanityDoc._id;
      console.log('✅ Sanity team member created:', sanityTeamMemberId);
    } catch (sanityError) {
      console.error('Sanity creation error:', sanityError);

      // Rollback: Delete Firebase user if it was created
      if (firebaseUid) {
        try {
          await adminAuth.deleteUser(firebaseUid);
          console.log('🔄 Rolled back Firebase user creation');
        } catch (rollbackError) {
          console.error('Failed to rollback Firebase user:', rollbackError);
        }
      }

      throw new Error('Failed to create team member in Sanity');
    }

    // Create Firestore team member auth record if portal access
    if (firebaseUid && sanityTeamMemberId) {
      try {
        await setTeamMemberAuth(firebaseUid, sanityTeamMemberId, email);
        console.log('✅ Firestore team member auth record created');
      } catch (firestoreError) {
        console.error('Firestore creation error:', firestoreError);

        // Rollback: Delete Firebase user and Sanity document
        try {
          await adminAuth.deleteUser(firebaseUid);
          await writeClient.delete(sanityTeamMemberId);
          console.log('🔄 Rolled back Firebase and Sanity creation');
        } catch (rollbackError) {
          console.error('Failed to rollback:', rollbackError);
        }

        throw new Error('Failed to create team member auth record');
      }
    }

    // TODO: Send welcome email with temporary password

    return NextResponse.json({
      success: true,
      teamMemberId: sanityTeamMemberId,
      firebaseUid,
      temporaryPassword: temporaryPassword || null,
      message: 'Team member created successfully',
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      {
        error: 'Failed to create team member',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
