import { NextRequest, NextResponse } from 'next/server'
import { client, writeClient } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, pastEventSlug } = body

    if (!token || !pastEventSlug) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Query for the livestream access token
    const accessData = await client.fetch(
      `*[_type == "livestreamAccess"
        && accessToken == $token
        && contentType == "pastEvent"
        && pastEvent->slug.current == $pastEventSlug
        && isActive == true][0] {
        _id,
        accessToken,
        attendeeEmail,
        attendeeName,
        accessType,
        isActive,
        accessCount,
        lastAccessed,
        "pastEvent": pastEvent-> {
          _id,
          title,
          slug,
          vimeoEmbedCode,
          eventDate,
          duration,
          speakers,
          isActive
        }
      }`,
      { token, pastEventSlug }
    )

    if (!accessData) {
      return NextResponse.json(
        { error: 'Invalid or expired access token. Please check your email for the correct link.' },
        { status: 401 }
      )
    }

    if (!accessData.isActive) {
      return NextResponse.json(
        { error: 'This access token has been deactivated. Please contact support.' },
        { status: 401 }
      )
    }

    if (!accessData.pastEvent?.isActive) {
      return NextResponse.json(
        { error: 'This recording is no longer available.' },
        { status: 400 }
      )
    }

    // Check if this is first access
    const isFirstAccess = !accessData.lastAccessed

    // Update access tracking
    await writeClient
      .patch(accessData._id)
      .set({
        lastAccessed: new Date().toISOString(),
        accessCount: (accessData.accessCount || 0) + 1,
      })
      .commit()

    // Return success response
    return NextResponse.json({
      valid: true,
      attendeeName: accessData.attendeeName,
      attendeeEmail: accessData.attendeeEmail,
      accessType: accessData.accessType,
      pastEvent: {
        title: accessData.pastEvent.title,
        slug: accessData.pastEvent.slug.current,
        vimeoEmbedCode: accessData.pastEvent.vimeoEmbedCode,
        eventDate: accessData.pastEvent.eventDate,
        duration: accessData.pastEvent.duration,
        speakers: accessData.pastEvent.speakers,
      },
      accessInfo: {
        accessCount: (accessData.accessCount || 0) + 1,
        firstAccess: isFirstAccess,
      },
    })
  } catch (error) {
    console.error('Error validating past event access:', error)
    return NextResponse.json(
      { error: 'Failed to validate access token' },
      { status: 500 }
    )
  }
}
