import { NextRequest, NextResponse } from 'next/server';
import { updateBooking, getBooking, getBookingByPaymentIntent } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { bookingId, responses } = data;

    if (!bookingId || !responses) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Resolve the actual Firestore document ID — the caller may pass either a
    // Stripe payment intent ID (from the confirmation page URL) or the real doc ID.
    let firestoreDocId = bookingId;
    const bookingByPaymentIntent = await getBookingByPaymentIntent(bookingId);
    if (bookingByPaymentIntent) {
      firestoreDocId = bookingByPaymentIntent.id;
    } else {
      const bookingByDocId = await getBooking(bookingId);
      if (!bookingByDocId) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        );
      }
      firestoreDocId = bookingByDocId.id;
    }

    // Update booking with intake form responses
    await updateBooking(firestoreDocId, {
      intakeForm: {
        submittedAt: new Date().toISOString(),
        responses,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Intake form submitted successfully',
    });
  } catch (error) {
    console.error('Error submitting intake form:', error);
    return NextResponse.json(
      {
        error: 'Failed to submit intake form',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
