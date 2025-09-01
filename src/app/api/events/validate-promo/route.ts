import { NextRequest, NextResponse } from 'next/server';

// Define your promo codes here
// In a production environment, you might want to store these in a database or CMS
const PROMO_CODES = {
  '605KINGDOMBUILDERS': { discountPercent: 50, description: '605 Kingdom Builders 50% Discount' },
  '99DEVELOPER': { discountPercent: 99, description: 'Developer Testing 99% Discount' },
} as const;

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

    const upperPromoCode = promoCode.toUpperCase();
    
    // Check if promo code exists
    const promoCodeInfo = PROMO_CODES[upperPromoCode as keyof typeof PROMO_CODES];
    
    if (!promoCodeInfo) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid promo code',
      });
    }

    // For now, we'll return the discount percentage
    // In a more complex system, you might:
    // 1. Check if the code is expired
    // 2. Check if it's applicable to this specific event
    // 3. Check usage limits
    // 4. Fetch event price and calculate actual discount

    return NextResponse.json({
      valid: true,
      promoCode: upperPromoCode,
      discountPercent: promoCodeInfo.discountPercent,
      description: promoCodeInfo.description,
    });

  } catch (error) {
    console.error('Error validating promo code:', error);
    return NextResponse.json(
      { error: 'Failed to validate promo code' },
      { status: 500 }
    );
  }
}
