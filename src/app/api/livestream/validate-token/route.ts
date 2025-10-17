import { NextRequest, NextResponse } from 'next/server';
import { client, writeClient } from '@/lib/sanity';

export async function POST(request: NextRequest) {
  try {
    const { token, eventSlug } = await request.json();

    if (!token || !eventSlug) {
      return NextResponse.json(
        { error: 'Token and event slug are required' },
        { status: 400 }
      );
    }

    // Fetch the livestream access record
    const livestreamAccess = await client.fetch(`
      *[_type == "livestreamAccess" && accessToken == $token][0] {
        _id,
        accessToken,
        attendeeEmail,
        attendeeName,
        isActive,
        createdAt,
        lastAccessed,
        accessCount,
        event-> {
          _id,
          title,
          slug,
          livestreamEnabled,
          restreamEmbedCode,
          eventSchedule,
          registrationType
        },
        eventRegistration-> {
          _id,
          status,
          attendee
        }
      }
    `, { token });

    if (!livestreamAccess) {
      return NextResponse.json(
        { error: 'Invalid access token' },
        { status: 401 }
      );
    }

    // Check if token is active
    if (!livestreamAccess.isActive) {
      return NextResponse.json(
        { error: 'Access token has been deactivated' },
        { status: 401 }
      );
    }

    // Check if event matches
    if (livestreamAccess.event?.slug?.current !== eventSlug) {
      return NextResponse.json(
        { error: 'Token is not valid for this event' },
        { status: 401 }
      );
    }

    // Check if event supports livestreaming
    if (livestreamAccess.event?.registrationType !== 'hybrid') {
      return NextResponse.json(
        { error: 'This event does not support livestreaming' },
        { status: 400 }
      );
    }

    // Check if livestream is enabled for the event
    if (!livestreamAccess.event?.livestreamEnabled) {
      return NextResponse.json(
        { error: 'Livestream is not currently available for this event' },
        { status: 400 }
      );
    }

    // Check if registration is still valid
    if (livestreamAccess.eventRegistration?.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Registration has been cancelled' },
        { status: 401 }
      );
    }

    // Update access count and last accessed time
    try {
      await writeClient
        .patch(livestreamAccess._id)
        .set({
          lastAccessed: new Date().toISOString(),
          accessCount: (livestreamAccess.accessCount || 0) + 1,
        })
        .commit();
    } catch (updateError) {
      console.warn('Failed to update access tracking:', updateError);
      // Don't fail the request if tracking update fails
    }

    // Return successful validation with user info
    const response = {
      valid: true,
      attendeeName: livestreamAccess.attendeeName,
      attendeeEmail: livestreamAccess.attendeeEmail,
      event: {
        title: livestreamAccess.event.title,
        slug: livestreamAccess.event.slug.current,
        restreamEmbedCode: livestreamAccess.event.restreamEmbedCode,
        eventSchedule: livestreamAccess.event.eventSchedule,
      },
      accessInfo: {
        accessCount: (livestreamAccess.accessCount || 0) + 1,
        firstAccess: !livestreamAccess.lastAccessed,
      }
    };

    console.log('Returning attendee info:', {
      name: response.attendeeName,
      email: response.attendeeEmail
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error validating livestream token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
