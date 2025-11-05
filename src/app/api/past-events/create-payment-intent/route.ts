import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { client, pastEventQueries } from '@/lib/sanity'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
})

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
        { error: 'This recording is not available for purchase' },
        { status: 400 }
      )
    }

    if (pastEvent.price <= 0) {
      return NextResponse.json(
        { error: 'This event is free. Use the register-free endpoint instead.' },
        { status: 400 }
      )
    }

    // Convert to cents
    const amountInCents = Math.round(pastEvent.price * 100)

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        type: 'past_event_purchase',
        pastEventId: pastEvent._id,
        pastEventSlug: pastEvent.slug.current,
        pastEventTitle: pastEvent.title,
        firstName,
        lastName,
        email,
        price: pastEvent.price.toString(),
      },
      receipt_email: email,
      description: `${pastEvent.title} - Recording Access`,
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      eventDetails: {
        title: pastEvent.title,
        price: pastEvent.price,
      },
    })
  } catch (error) {
    console.error('Error creating past event payment intent:', error)
    return NextResponse.json(
      { error: 'Failed to create payment intent' },
      { status: 500 }
    )
  }
}
