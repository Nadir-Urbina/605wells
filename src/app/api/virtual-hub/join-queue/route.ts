import { NextRequest, NextResponse } from 'next/server';
import { createQueueEntry } from '@/lib/firestore-admin';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.ministryType || !data.ministryTypeTitle) {
      return NextResponse.json(
        { error: 'Ministry type is required' },
        { status: 400 }
      );
    }

    if (
      !data.attendeeInfo?.firstName ||
      !data.attendeeInfo?.lastName ||
      !data.attendeeInfo?.email
    ) {
      return NextResponse.json(
        { error: 'Attendee information is required' },
        { status: 400 }
      );
    }

    if (
      !data.preferredDays ||
      data.preferredDays.length === 0 ||
      !data.preferredTimes ||
      data.preferredTimes.length === 0
    ) {
      return NextResponse.json(
        { error: 'Preferred days and times are required' },
        { status: 400 }
      );
    }

    // Create queue entry in Firestore
    const queueEntryId = await createQueueEntry({
      ministryType: data.ministryType,
      ministryTypeTitle: data.ministryTypeTitle,
      attendeeInfo: {
        firstName: data.attendeeInfo.firstName,
        lastName: data.attendeeInfo.lastName,
        email: data.attendeeInfo.email,
        phone: data.attendeeInfo.phone,
      },
      preferredDays: data.preferredDays,
      preferredTimes: data.preferredTimes,
      requestMessage: data.requestMessage,
      status: 'pending',
    });

    // TODO: Send confirmation email
    // await sendQueueConfirmationEmail({
    //   email: data.attendeeInfo.email,
    //   firstName: data.attendeeInfo.firstName,
    //   lastName: data.attendeeInfo.lastName,
    //   ministryType: data.ministryTypeTitle,
    // });

    return NextResponse.json({
      success: true,
      queueEntryId,
      message: 'Successfully added to queue. You will receive a confirmation email shortly.',
    });
  } catch (error) {
    console.error('Error adding to queue:', error);
    return NextResponse.json(
      {
        error: 'Failed to add to queue',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
