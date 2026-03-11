import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { client } from '@/lib/sanity';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20' as Stripe.LatestApiVersion,
});

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    // Validate required fields
    if (!data.ministryTypeId || !data.teamMemberId || !data.scheduledDate || !data.scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required booking information' },
        { status: 400 }
      );
    }

    if (
      !data.attendeeInfo?.firstName ||
      !data.attendeeInfo?.lastName ||
      !data.attendeeInfo?.email
    ) {
      return NextResponse.json(
        { error: 'Attendee information is required' },
        { status: 400 }
      );
    }

    // Fetch ministry type from Sanity to get pricing
    const ministryType = await client.fetch(
      `*[_type == "ministryType" && _id == $ministryTypeId][0] {
        _id,
        title,
        price,
        averageDuration
      }`,
      { ministryTypeId: data.ministryTypeId }
    );

    if (!ministryType) {
      return NextResponse.json(
        { error: 'Ministry type not found' },
        { status: 404 }
      );
    }

    if (!ministryType.price || ministryType.price <= 0) {
      return NextResponse.json(
        { error: 'This ministry type does not have a valid price' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(ministryType.price * 100), // Convert to cents
      currency: 'usd',
      description: `${ministryType.title} Session`,
      metadata: {
        ministryTypeId: data.ministryTypeId,
        ministryTypeTitle: ministryType.title,
        teamMemberId: data.teamMemberId,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        attendeeFirstName: data.attendeeInfo.firstName,
        attendeeLastName: data.attendeeInfo.lastName,
        attendeeEmail: data.attendeeInfo.email,
        attendeePhone: data.attendeeInfo.phone || '',
        duration: ministryType.averageDuration.toString(),
      },
    });

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      amount: ministryType.price,
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      {
        error: 'Failed to create payment intent',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
