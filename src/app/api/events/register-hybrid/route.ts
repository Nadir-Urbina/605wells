import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
});

const PROMO_CODES = {
  '605KINGDOMBUILDERS': { discountPercent: 50, description: '605 Kingdom Builders 50% Discount' },
  '99DEVELOPER': { discountPercent: 99, description: 'Developer Testing 99% Discount' },
  'EGBUILD605': { discountPercent: 50, description: 'East Gate Build 605 50% Discount' },
} as const;

export async function POST(request: NextRequest) {
  try {
    const {
      eventId,
      attendeeInfo,
      attendanceType,
      promoCode,
      pricing,
    } = await request.json();

    // Validate required fields
    if (!eventId || !attendeeInfo || !attendanceType) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Get the correct price based on attendance type
    const originalPrice = attendanceType === 'in-person' 
      ? (pricing.inPersonPrice || 0) 
      : (pricing.onlinePrice || 0);
    
    // Calculate final price (use provided finalPrice if available, otherwise use original)
    let finalPrice = pricing.finalPrice || originalPrice;
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
