import { NextRequest, NextResponse } from 'next/server';
import { validatePromoCode, applyPromoDiscount } from '@/lib/promo-codes';
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

    // Calculate price with promo code discounts. The price comes from Sanity and
    // the code is re-validated here, so a tampered client cannot fake a discount.
    const originalPrice = event.price || 0;
    let finalPrice = originalPrice;
    let discountApplied = false;
    let appliedPromoCode: string | null = null;
    let promoDiscountAmount = 0;

    // An unrecognized code is ignored rather than rejected: the forms submit
    // whatever is in the box, even when the attendee never pressed Apply.
    if (promoCode) {
      const promoResult = await validatePromoCode(promoCode, event._id);

      if (promoResult.valid) {
        const discount = applyPromoDiscount(originalPrice, promoResult.discountPercent!);
        finalPrice = discount.finalPrice;
        promoDiscountAmount = discount.discountAmount;
        discountApplied = true;
        appliedPromoCode = promoResult.code!;
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
      description: `Event Registration - ${event.title}`,
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
        promoCode: appliedPromoCode || '',
        promoCodeDiscount: promoDiscountAmount.toString(),
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
        promoCodeApplied: appliedPromoCode,
        promoCodeDiscount: promoDiscountAmount,
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
