import { NextRequest, NextResponse } from 'next/server';
import { client, eventQueries, createEventRegistration, type SanityEventRegistration, type EventSession } from '@/lib/sanity';
import { sendFreeEventRegistrationConfirmation } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { eventId, attendeeInfo } = await request.json();

    // Validate required fields
    if (!eventId || !attendeeInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate attendee info
    if (!attendeeInfo.firstName || !attendeeInfo.lastName || !attendeeInfo.email) {
      return NextResponse.json(
        { error: 'Attendee first name, last name, and email are required' },
        { status: 400 }
      );
    }

    // Fetch event details from Sanity
    const event = await client.fetch(eventQueries.eventBySlug, { slug: eventId });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate event is available for free internal registration
    if (event.registrationType !== 'internal-free') {
      return NextResponse.json(
        { error: 'Event does not support free internal registration' },
        { status: 400 }
      );
    }

    // Check if registration is closed
    if (event.registrationClosed) {
      return NextResponse.json(
        { error: 'Registration is closed for this event' },
        { status: 400 }
      );
    }

    // Check registration deadline
    if (event.registrationDeadline) {
      const deadline = new Date(event.registrationDeadline);
      if (new Date() > deadline) {
        return NextResponse.json(
          { error: 'Registration deadline has passed' },
          { status: 400 }
        );
      }
    }

    // Check registration limit
    if (event.registrationLimit) {
      // Get current registration count
      const registrations = await client.fetch(`
        *[_type == "eventRegistration" && event._ref == $eventId && status != "cancelled"] {
          _id
        }
      `, { eventId: event._id });

      if (registrations.length >= event.registrationLimit) {
        return NextResponse.json(
          { error: 'Event is full. Registration limit reached.' },
          { status: 400 }
        );
      }
    }

    // Format event date and time for email (always in Eastern Time)
    let eventDate = 'Date TBD';
    let eventTime = 'Time TBD';

    if (event.eventSchedule && event.eventSchedule.length > 0) {
      const firstSession = event.eventSchedule[0];
      if (firstSession.startTime && firstSession.endTime) {
        const startDate = new Date(firstSession.startTime);
        const endDate = new Date(firstSession.endTime);

        eventDate = startDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          timeZone: 'America/New_York',
        });

        eventTime = `${startDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        })} - ${endDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        })} EST`;
      }
    }

    // Format the full event schedule for email (always in Eastern Time)
    const formattedEventSchedule = event.eventSchedule?.map((session: EventSession) => {
      const sessionStartDate = new Date(session.startTime);
      const sessionEndDate = new Date(session.endTime);

      return {
        sessionTitle: session.sessionTitle,
        date: sessionStartDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
          timeZone: 'America/New_York',
        }),
        time: `${sessionStartDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        })} - ${sessionEndDate.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/New_York',
        })} EST`,
        startTime: session.startTime,
        endTime: session.endTime,
      };
    });

    // Create registration record in Sanity
    const registrationData: SanityEventRegistration = {
      _type: 'eventRegistration',
      event: {
        _type: 'reference',
        _ref: event._id,
      },
      attendee: {
        firstName: attendeeInfo.firstName,
        lastName: attendeeInfo.lastName,
        email: attendeeInfo.email,
        phone: attendeeInfo.phone || undefined,
      },
      // No payment info for free events
      registrationDate: new Date().toISOString(),
      status: 'confirmed',
      emailsSent: [{
        type: 'confirmation',
        sentAt: new Date().toISOString(),
        subject: `Free Registration Confirmed - ${event.title}`,
      }],
    };

    const savedRegistration = await createEventRegistration(registrationData);
    console.log('✅ Free event registration saved to Sanity:', savedRegistration._id);

    // Send confirmation email
    try {
      await sendFreeEventRegistrationConfirmation({
        email: attendeeInfo.email,
        firstName: attendeeInfo.firstName,
        lastName: attendeeInfo.lastName,
        eventTitle: event.title,
        eventDate,
        eventTime,
        eventSchedule: formattedEventSchedule,
        eventLocation: event.location?.name,
        eventAddress: event.location?.address,
        registrationInstructions: event.registrationInstructions,
      });
      
      console.log('✅ Free event registration confirmation email sent to:', attendeeInfo.email);
    } catch (emailError) {
      console.error('❌ Failed to send free registration confirmation email:', emailError);
      // Don't throw error - registration succeeded, email failure shouldn't break the flow
    }

    return NextResponse.json({
      success: true,
      registrationId: savedRegistration._id,
      message: 'Registration successful! You will receive a confirmation email shortly.',
    });

  } catch (error) {
    console.error('Error processing free event registration:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Error processing registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
