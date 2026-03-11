import { NextRequest, NextResponse } from 'next/server';
import { getBooking, getBookingByPaymentIntent } from '@/lib/firestore-admin';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  try {
    const { bookingId } = await params;

    if (!bookingId) {
      return NextResponse.json(
        { error: 'Booking ID is required' },
        { status: 400 }
      );
    }

    // Fetch booking from Firestore
    // Try by payment intent ID first (for confirmation page), then by document ID
    let booking = await getBookingByPaymentIntent(bookingId);

    if (!booking) {
      // Fallback: try by document ID
      booking = await getBooking(bookingId);
    }

    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      booking: {
        ministryType: booking.ministryType,
        ministryTypeTitle: booking.ministryTypeTitle,
        teamMemberName: booking.teamMemberName,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        duration: booking.duration,
        attendeeInfo: booking.attendeeInfo,
        payment: booking.payment,
        videoMeeting: booking.videoMeeting,
        intakeForm: booking.intakeForm,
      },
    });
  } catch (error) {
    console.error('Error fetching booking:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch booking',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
