import { NextRequest, NextResponse } from 'next/server';
import { updateBooking } from '@/lib/firestore-admin';

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

    // Update booking with intake form responses
    await updateBooking(bookingId, {
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
