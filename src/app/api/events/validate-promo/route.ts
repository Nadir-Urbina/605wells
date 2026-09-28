import { NextRequest, NextResponse } from 'next/server';
import { client, eventQueries } from '@/lib/sanity';
import { validatePromoCode } from '@/lib/promo-codes';

// Display-only validation for the registration forms. The authoritative check
// runs again inside the registration routes, which recompute the price from
// Sanity rather than trusting anything the browser sends.
export async function POST(request: NextRequest) {
  try {
    const { eventId, promoCode } = await request.json();

    // Validate required fields
    if (!eventId || !promoCode) {
      return NextResponse.json(
        { error: 'Event ID and promo code are required' },
        { status: 400 }
      );
    }

    // Forms send the event slug; resolve it so event-restricted codes apply.
    const event = await client.fetch(eventQueries.eventBySlug, { slug: eventId });

    const result = await validatePromoCode(promoCode, event?._id);

    if (!result.valid) {
      return NextResponse.json({
        valid: false,
        error: result.error,
      });
    }

    return NextResponse.json({
      valid: true,
      promoCode: result.code,
      discountPercent: result.discountPercent,
      description: result.description,
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
