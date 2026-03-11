import { NextRequest, NextResponse } from 'next/server';
import { verifyTeamMemberSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { getAvailability, setAvailability } from '@/lib/firestore-admin';

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

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'startDate and endDate are required' },
        { status: 400 }
      );
    }

    // Fetch availability for team member
    const availabilitySlots = await getAvailability(
      session.sanityTeamMemberId,
      startDate,
      endDate
    );

    // Transform into date-keyed object
    const availability: Record<string, unknown[]> = {};
    availabilitySlots.forEach((slot) => {
      availability[slot.date] = slot.timeSlots;
    });

    return NextResponse.json({
      availability,
      teamMemberId: session.sanityTeamMemberId,
      startDate,
      endDate,
    });
  } catch (error) {
    console.error('Error fetching availability:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const { date, timeSlots } = await request.json();

    if (!date || !timeSlots) {
      return NextResponse.json(
        { error: 'date and timeSlots are required' },
        { status: 400 }
      );
    }

    // Save availability
    await setAvailability(session.sanityTeamMemberId, date, timeSlots);

    return NextResponse.json({
      success: true,
      message: 'Availability saved successfully',
    });
  } catch (error) {
    console.error('Error saving availability:', error);
    return NextResponse.json(
      {
        error: 'Failed to save availability',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
