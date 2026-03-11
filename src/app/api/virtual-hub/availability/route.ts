import { NextRequest, NextResponse } from 'next/server';
import { getAvailability } from '@/lib/firestore-admin';
import { generateTimeSlots } from '@/lib/calendar';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const teamMemberId = searchParams.get('teamMemberId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!teamMemberId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Get availability from Firestore
    const availabilitySlots = await getAvailability(teamMemberId, startDate, endDate);

    // Transform into date-keyed object
    const availability: Record<string, unknown[]> = {};

    availabilitySlots.forEach((slot) => {
      availability[slot.date] = slot.timeSlots;
    });

    // If team member is "any", we'll need different logic
    // For now, return the availability as-is
    if (teamMemberId === 'any') {
      // TODO: Implement logic to aggregate availability from all team members
      // For now, return empty availability
      return NextResponse.json({
        availability: {},
        message: '"Any available" option selected - this will match you with the next available team member',
      });
    }

    return NextResponse.json({
      availability,
      teamMemberId,
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
