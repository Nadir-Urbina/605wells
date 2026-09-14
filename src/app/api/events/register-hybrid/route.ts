import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { writeClient, eventQueries, type SanityEvent } from '@/lib/sanity';
import { getInPersonAvailability } from '@/lib/hybrid-capacity';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const PROMO_CODES = {
  '605KINGDOMBUILDERS': { discountPercent: 50, description: 'East Gate Jax Kingdom Builders 50% Discount' },
  '99DEVELOPER': { discountPercent: 99, description: 'Developer Testing 99% Discount' },
  'EGBUILD605': { discountPercent: 50, description: 'East Gate Build 605 50% Discount' },
  '50PERCENT605': { discountPercent: 50, description: '50% Discount' },
} as const;

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      attendeeInfo,
      attendanceType,
      promoCode,
    } = await request.json();

    // Validate required fields
    if (!eventId || !attendeeInfo || (attendanceType !== 'in-person' && attendanceType !== 'online')) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Read from the API rather than the CDN so the in-person seat count is current
    const event: SanityEvent | null = await writeClient.fetch(eventQueries.eventBySlug, { slug: eventId });

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (event.registrationType !== 'hybrid') {
      return NextResponse.json({ error: 'Event does not support hybrid registration' }, { status: 400 });
    }

    if (event.registrationClosed) {
      return NextResponse.json({ error: 'Registration is closed for this event' }, { status: 400 });
    }

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    if (attendanceType === 'in-person' && getInPersonAvailability(event).isFull) {
      return NextResponse.json(
        { error: 'In-person registration is full. You can still register to join online.', inPersonFull: true },
        { status: 409 }
      );
    }

    // Price comes from the event, not the request, so it can't be altered client-side
    const originalPrice = attendanceType === 'in-person'
      ? (event.price || 0)
      : (event.onlinePrice || 0);

    let finalPrice = originalPrice;
    let promoCodeDiscount = 0;
    let promoCodeApplied = null;

    // Apply promo code if provided
    if (promoCode) {
      const upperPromoCode = promoCode.toUpperCase();
      const promoCodeInfo = PROMO_CODES[upperPromoCode as keyof typeof PROMO_CODES];
      
      if (promoCodeInfo) {
        promoCodeDiscount = promoCodeInfo.discountPercent;
        const discountAmount = (originalPrice * promoCodeDiscount) / 100;
        finalPrice = Math.max(0, originalPrice - discountAmount);
        promoCodeApplied = upperPromoCode;
      }
    }

    // Convert to cents for Stripe
    const amountInCents = Math.round(finalPrice * 100);

    if (amountInCents <= 0) {
      return NextResponse.json(
        { error: 'Invalid amount for payment' },
        { status: 400 }
      );
    }

    // Create Stripe Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        type: 'event_registration',
        eventId,
        attendeeFirstName: attendeeInfo.firstName,
        attendeeLastName: attendeeInfo.lastName,
        attendeeEmail: attendeeInfo.email,
        attendeePhone: attendeeInfo.phone || '',
        attendanceType,
        promoCode: promoCodeApplied || '',
        promoCodeDiscount: promoCodeDiscount.toString(),
        originalPrice: originalPrice.toString(),
        finalPrice: finalPrice.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      eventDetails: {
        eventId,
        attendeeInfo,
        attendanceType,
        originalPrice,
        finalPrice,
        promoCode: promoCodeApplied,
        promoCodeDiscount,
      },
    });

  } catch (error) {
    console.error('Error creating hybrid in-person payment intent:', error);
    return NextResponse.json(
      { error: 'Error processing registration', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
