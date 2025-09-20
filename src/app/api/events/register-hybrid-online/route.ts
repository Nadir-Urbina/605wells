import { NextRequest, NextResponse } from 'next/server';
import { client, eventQueries, createEventRegistration, type SanityEvent, type SanityEventRegistration } from '@/lib/sanity';
import { sendOnlineEventRegistrationConfirmation } from '@/lib/resend';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { eventId, attendeeInfo, attendanceType, pricing } = await request.json();

    // Validate required fields
    if (!eventId || !attendeeInfo || attendanceType !== 'online') {
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
    const event: SanityEvent = await client.fetch(eventQueries.eventBySlug, { slug: eventId });
    
    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    // Validate event is a hybrid event
    if (event.registrationType !== 'hybrid') {
      return NextResponse.json(
        { error: 'Event does not support hybrid registration' },
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

    // This endpoint only handles free online registrations
    // Paid online registrations should use the webhook flow via /api/events/register-hybrid
    if ((event.onlinePrice || 0) > 0 && (!pricing || pricing.finalPrice > 0)) {
      return NextResponse.json(
        { error: 'Paid online registrations should use the payment flow. This endpoint is for free registrations only.' },
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

    // Format event date and time for email
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
        });
        
        eventTime = `${startDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })} - ${endDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`;
      }
    }

    // Generate unique access token for livestream
    const accessToken = crypto.randomBytes(32).toString('hex');

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
      // For free online events, no payment info needed
      // For paid online events, we'd handle payment here
      ...(pricing.finalPrice > 0 && {
        payment: {
          stripePaymentIntentId: 'online-' + Date.now(), // Placeholder for now
          amount: pricing.finalPrice,
          originalPrice: pricing.originalPrice || pricing.finalPrice,
          discountApplied: pricing.discountApplied || false,
          discountAmount: pricing.originalPrice ? pricing.originalPrice - pricing.finalPrice : 0,
          paymentMethod: 'online',
          status: 'completed',
        }
      }),
      registrationDate: new Date().toISOString(),
      status: 'confirmed',
      emailsSent: [{
        type: 'confirmation',
        sentAt: new Date().toISOString(),
        subject: `Online Registration Confirmed - ${event.title}`,
      }],
    };

    const savedRegistration = await createEventRegistration(registrationData);
    console.log('✅ Online event registration saved to Sanity:', savedRegistration._id);

    // Create livestream access token
    const livestreamAccess = {
      _type: 'livestreamAccess',
      event: {
        _type: 'reference',
        _ref: event._id,
      },
      eventRegistration: {
        _type: 'reference',
        _ref: savedRegistration._id,
      },
      accessToken,
      attendeeEmail: attendeeInfo.email,
      attendeeName: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    };

    const savedLivestreamAccess = await client.create(livestreamAccess);
    console.log('✅ Livestream access token created:', savedLivestreamAccess._id);

    // Send confirmation email with livestream access
    try {
      await sendOnlineEventRegistrationConfirmation({
        email: attendeeInfo.email,
        firstName: attendeeInfo.firstName,
        lastName: attendeeInfo.lastName,
        eventTitle: event.title,
        eventDate,
        eventTime,
        eventLocation: event.location?.name,
        eventAddress: event.location?.address,
        registrationInstructions: event.registrationInstructions,
        accessToken,
        livestreamUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.605wells.com'}/livestream/${event.slug.current}?token=${accessToken}`,
        finalPrice: pricing.finalPrice,
        originalPrice: pricing.originalPrice,
        discountApplied: pricing.discountApplied,
        promoCode: pricing.promoCodeApplied,
        promoCodeDiscount: pricing.promoCodeDiscount,
      });
      
      console.log('✅ Online event registration confirmation email sent to:', attendeeInfo.email);
    } catch (emailError) {
      console.error('❌ Failed to send online registration confirmation email:', emailError);
      // Don't throw error - registration succeeded, email failure shouldn't break the flow
    }

    return NextResponse.json({
      success: true,
      registrationId: savedRegistration._id,
      accessToken,
      livestreamUrl: `/livestream/${event.slug.current}?token=${accessToken}`,
      message: 'Online registration successful! Check your email for livestream access details.',
    });

  } catch (error) {
    console.error('Error processing online hybrid registration:', error);
    
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Error processing online registration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
