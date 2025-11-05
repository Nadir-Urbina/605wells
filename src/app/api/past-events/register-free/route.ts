import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { writeClient, client, pastEventQueries } from '@/lib/sanity'
import { sendPastEventAccessConfirmation } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { pastEventId, firstName, lastName, email } = body

    // Validate required fields
    if (!pastEventId || !firstName || !lastName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Fetch past event details from Sanity
    const pastEvent = await client.fetch(pastEventQueries.pastEventBySlug, {
      slug: pastEventId,
    })

    if (!pastEvent) {
      return NextResponse.json(
        { error: 'Past event not found' },
        { status: 404 }
      )
    }

    if (!pastEvent.isActive) {
      return NextResponse.json(
        { error: 'This recording is not available' },
        { status: 400 }
      )
    }

    if (pastEvent.price > 0) {
      return NextResponse.json(
        { error: 'This event requires payment. Use the checkout endpoint instead.' },
        { status: 400 }
      )
    }

    // Generate access token
    const accessToken = crypto.randomBytes(32).toString('hex')

    // Create livestream access record
    const accessRecord = {
      _type: 'livestreamAccess' as const,
      contentType: 'pastEvent' as const,
      pastEvent: {
        _type: 'reference' as const,
        _ref: pastEvent._id,
      },
      accessType: 'purchased' as const, // Even though free, it's still a "purchase"
      accessToken,
      attendeeEmail: email,
      attendeeName: `${firstName} ${lastName}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      accessCount: 0,
    }

    const result = await writeClient.create(accessRecord)
    console.log('Created past event access token:', result._id)

    // Send confirmation email
    try {
      await sendPastEventAccessConfirmation({
        toEmail: email,
        attendeeName: `${firstName} ${lastName}`,
        pastEventTitle: pastEvent.title,
        pastEventSlug: pastEvent.slug.current,
        accessToken,
        eventDate: pastEvent.eventDate,
        duration: pastEvent.duration,
        speakers: pastEvent.speakers,
        price: pastEvent.price,
      })
      console.log('Sent past event access confirmation email to:', email)
    } catch (emailError) {
      console.error('Failed to send confirmation email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      accessToken,
      message: 'Access granted! Check your email for the link.',
    })
  } catch (error) {
    console.error('Error registering for free past event:', error)
    return NextResponse.json(
      { error: 'Failed to register for event' },
      { status: 500 }
    )
  }
}
