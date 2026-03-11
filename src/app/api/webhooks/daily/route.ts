import { NextRequest, NextResponse } from 'next/server';
import { updateBooking, getBookingByRoomName } from '@/lib/firestore-admin';

/**
 * Daily.co Webhook Handler
 *
 * Handles webhooks from Daily.co, primarily for recording completion notifications
 *
 * Webhook events: https://docs.daily.co/reference/rest-api/webhooks
 */

interface DailyRecordingWebhook {
  event: 'recording.ready-to-download' | 'recording.error';
  payload: {
    room_name: string;
    recording_id: string;
    start_time: number;
    duration: number;
    download_url?: string;
    status: 'finished' | 'error';
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as DailyRecordingWebhook;

    console.log('Daily.co webhook received:', body.event, body.payload.room_name);

    // Handle recording completion
    if (body.event === 'recording.ready-to-download') {
      await handleRecordingReady(body.payload);
    } else if (body.event === 'recording.error') {
      await handleRecordingError(body.payload);
    } else {
      console.log('Unhandled Daily.co webhook event:', body.event);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Daily.co webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleRecordingReady(payload: DailyRecordingWebhook['payload']) {
  console.log('Recording ready for room:', payload.room_name);

  try {
    // Find booking by room name
    const booking = await getBookingByRoomName(payload.room_name);

    if (!booking) {
      console.warn('No booking found for room:', payload.room_name);
      return;
    }

    // Update booking with recording information
    await updateBooking(booking.id, {
      'videoMeeting.recordingUrl': payload.download_url,
      'videoMeeting.recordingDownloadUrl': payload.download_url,
      'videoMeeting.recordingStatus': 'available',
      'videoMeeting.recordingDuration': payload.duration,
    });

    console.log('✅ Booking updated with recording URL:', booking.id);

    // TODO: Send notification email to team member and attendee with recording link
  } catch (error) {
    console.error('Error handling recording ready webhook:', error);
  }
}

async function handleRecordingError(payload: DailyRecordingWebhook['payload']) {
  console.error('Recording failed for room:', payload.room_name);

  try {
    // Find booking by room name
    const booking = await getBookingByRoomName(payload.room_name);

    if (!booking) {
      console.warn('No booking found for room:', payload.room_name);
      return;
    }

    // Update booking with error status
    await updateBooking(booking.id, {
      'videoMeeting.recordingStatus': 'failed',
    });

    console.log('⚠️ Booking marked with failed recording:', booking.id);

    // TODO: Send notification to admin about recording failure
  } catch (error) {
    console.error('Error handling recording error webhook:', error);
  }
}
