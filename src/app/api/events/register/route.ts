import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { client, eventQueries } from '@/lib/sanity';

// Initialize Stripe
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
  });
};

// Define promo codes
const PROMO_CODES = {
  '605KINGDOMBUILDERS': { discountPercent: 50, description: '605 Kingdom Builders 50% Discount' },
  '99DEVELOPER': { discountPercent: 99, description: 'Developer Testing 99% Discount' },
  'EGBUILD605': { discountPercent: 50, description: 'East Gate Build 605 50% Discount' },
} as const;

export async function POST(request: NextRequest) {
  try {
    const stripe = getStripeInstance();
    
    const { eventId, attendeeInfo, customerInfo, promoCode } = await request.json();

    // Validate required fields
    if (!eventId || !attendeeInfo || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
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

    // Validate event is available for internal registration
    if (event.registrationType !== 'internal') {
      return NextResponse.json(
        { error: 'Event does not support internal registration' },
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

    // TODO: Check registration limit (would need to implement registration count tracking)
    // This would require querying existing registrations from Stripe or a separate database

    // Calculate price with promo code discounts
    const originalPrice = event.price || 0;
    let finalPrice = originalPrice;
    let discountApplied = false;
    let promoCodeInfo = null;

    // Apply promo code discount if provided
    if (promoCode) {
      const upperPromoCode = promoCode.toUpperCase();
      promoCodeInfo = PROMO_CODES[upperPromoCode as keyof typeof PROMO_CODES];
      
      if (promoCodeInfo) {
        const discountAmount = (originalPrice * promoCodeInfo.discountPercent) / 100;
        finalPrice = Math.max(0, originalPrice - discountAmount);
        discountApplied = true;
      }
    }

    // Handle free events
    if (finalPrice === 0) {
      // For free events, we could create a record directly
      // For now, we'll still use Stripe for consistency and record-keeping
      finalPrice = 1; // Minimum Stripe amount is $0.50, but we'll use $0.01
    }

    // Convert to cents
    const amountInCents = Math.round(finalPrice * 100);

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: amountInCents,
      currency: 'usd',
      metadata: {
        type: 'event_registration',
        eventId: event._id,
        eventSlug: event.slug.current,
        eventTitle: event.title,
        attendeeName: `${attendeeInfo.firstName} ${attendeeInfo.lastName}`,
        attendeeFirstName: attendeeInfo.firstName,
        attendeeLastName: attendeeInfo.lastName,
        attendeeEmail: attendeeInfo.email,
        attendeePhone: attendeeInfo.phone || '',
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerFirstName: customerInfo.firstName,
        customerLastName: customerInfo.lastName,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone || '',
        customerAddress: customerInfo.address || '',
        customerCity: customerInfo.city || '',
        customerState: customerInfo.state || '',
        customerZipCode: customerInfo.zipCode || '',
        originalPrice: originalPrice.toString(),
        finalPrice: finalPrice.toString(),
        discountApplied: discountApplied.toString(),
        promoCode: promoCode || '',
        promoCodeDiscount: promoCodeInfo ? ((originalPrice * promoCodeInfo.discountPercent) / 100).toString() : '0',
        eventSchedule: JSON.stringify(event.eventSchedule?.[0] || {}),
        eventLocation: JSON.stringify(event.location || {}),
        registrationInstructions: event.registrationInstructions || '',
      },
      receipt_email: customerInfo.email,
    };

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      eventDetails: {
        title: event.title,
        price: originalPrice,
        finalPrice: finalPrice,
        discountApplied,
        promoCodeApplied: promoCode || null,
        promoCodeDiscount: promoCodeInfo ? (originalPrice * promoCodeInfo.discountPercent) / 100 : 0,
      },
    });

  } catch (error) {
    console.error('Error creating event registration payment intent:', error);
    
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
