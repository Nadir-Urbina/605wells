import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { writeClient, client } from '@/lib/sanity'
import { sendPastEventAccessConfirmation } from '@/lib/resend'

/**
 * Admin endpoint to generate complimentary access tokens for in-person attendees
 * This allows admins to grant past event recording access to people who attended in-person
 */
export async function POST(request: NextRequest) {
  try {
    // TODO: Add admin authentication check here
    // const isAdmin = await verifyAdminAuth(request)
    // if (!isAdmin) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    // }

    const body = await request.json()
    const { pastEventSlug, originalEventId, originalEventSlug, sendEmails = true } = body

    if (!pastEventSlug) {
      return NextResponse.json(
        { error: 'Missing pastEventSlug' },
        { status: 400 }
      )
    }

    // Fetch the past event
    const pastEvent = await client.fetch(
      `*[_type == "pastEvent" && slug.current == $slug][0] {
        _id,
        title,
        slug,
        eventDate,
        duration,
        speakers,
        price,
        originalEvent
      }`,
      { slug: pastEventSlug }
    )

    if (!pastEvent) {
      return NextResponse.json(
        { error: 'Past event not found' },
        { status: 404 }
      )
    }

    // Determine which event to pull registrations from
    let eventToQuery = originalEventId || pastEvent.originalEvent?._ref

    // If no ID provided but slug is provided, look it up
    if (!eventToQuery && originalEventSlug) {
      const event = await client.fetch(
        `*[_type == "event" && slug.current == $slug][0] { _id }`,
        { slug: originalEventSlug }
      )
      eventToQuery = event?._id
    }

    if (!eventToQuery) {
      return NextResponse.json(
        { error: 'No original event specified. Please provide originalEventId/originalEventSlug or link the pastEvent to an originalEvent in Sanity.' },
        { status: 400 }
      )
    }

    // Fetch ALL registrations for the original event (both in-person and online)
    const registrations = await client.fetch(
      `*[_type == "eventRegistration"
        && event._ref == $eventId
        && status != "cancelled"] {
        _id,
        attendee,
        attendanceType,
        status
      }`,
      { eventId: eventToQuery }
    )

    if (registrations.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No registrations found',
        tokensCreated: 0,
        emailsSent: 0,
      })
    }

    const results = {
      tokensCreated: 0,
      emailsSent: 0,
      errors: [] as string[],
    }

    // Generate tokens for each attendee
    for (const registration of registrations) {
      try {
        const { attendee } = registration
        const attendeeName = `${attendee.firstName} ${attendee.lastName}`

        // Check if token already exists for this person
        const existingToken = await client.fetch(
          `*[_type == "livestreamAccess"
            && contentType == "pastEvent"
            && pastEvent._ref == $pastEventId
            && attendeeEmail == $email][0]`,
          { pastEventId: pastEvent._id, email: attendee.email }
        )

        if (existingToken) {
          console.log(`Token already exists for ${attendee.email}, skipping...`)
          continue
        }

        // Generate new access token
        const accessToken = crypto.randomBytes(32).toString('hex')

        // Create livestream access record
        const accessRecord = {
          _type: 'livestreamAccess',
          contentType: 'pastEvent',
          pastEvent: {
            _type: 'reference',
            _ref: pastEvent._id,
          },
          eventRegistration: {
            _type: 'reference',
            _ref: registration._id,
          },
          accessType: 'complimentary',
          accessToken,
          attendeeEmail: attendee.email,
          attendeeName,
          isActive: true,
          createdAt: new Date().toISOString(),
          accessCount: 0,
        }

        await writeClient.create(accessRecord)
        results.tokensCreated++
        console.log(`✅ Created complimentary token for ${attendeeName}`)

        // Send email if requested
        if (sendEmails) {
          try {
            await sendPastEventAccessConfirmation({
              toEmail: attendee.email,
              attendeeName,
              pastEventTitle: pastEvent.title,
              pastEventSlug: pastEvent.slug.current,
              accessToken,
              eventDate: pastEvent.eventDate,
              duration: pastEvent.duration,
              speakers: pastEvent.speakers,
              price: 0, // Complimentary
            })
            results.emailsSent++
            console.log(`✅ Sent email to ${attendee.email}`)
          } catch (emailError) {
            console.error(`Failed to send email to ${attendee.email}:`, emailError)
            results.errors.push(`Email failed for ${attendee.email}`)
          }
        }
      } catch (error) {
        console.error(`Error processing registration ${registration._id}:`, error)
        results.errors.push(`Failed to process ${registration.attendee.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Generated ${results.tokensCreated} complimentary access tokens`,
      tokensCreated: results.tokensCreated,
      emailsSent: results.emailsSent,
      totalRegistrations: registrations.length,
      errors: results.errors.length > 0 ? results.errors : undefined,
    })
  } catch (error) {
    console.error('Error generating complimentary access:', error)
    return NextResponse.json(
      { error: 'Failed to generate complimentary access' },
      { status: 500 }
    )
  }
}
