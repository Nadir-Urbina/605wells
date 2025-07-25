import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe only if the secret key is available
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2025-06-30.basil',
  });
};

export async function POST(request: NextRequest) {
  try {
    // Get Stripe instance with proper error handling
    const stripe = getStripeInstance();
    
    const { amount, donationType, customerInfo, motivationMessage } = await request.json();

    // Validate amount
    const donationAmount = Math.round(amount * 100); // Convert to cents
    const minAmount = 10 * 100; // $10 minimum
    const maxAmount = 10000 * 100; // $10,000 maximum

    if (donationAmount < minAmount || donationAmount > maxAmount) {
      return NextResponse.json(
        { error: 'Invalid donation amount' },
        { status: 400 }
      );
    }

    // Create payment intent
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: donationAmount,
      currency: 'usd',
      metadata: {
        donationType,
        customerName: `${customerInfo.firstName} ${customerInfo.lastName}`,
        customerEmail: customerInfo.email,
        customerPhone: customerInfo.phone,
        customerAddress: JSON.stringify({
          line1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postal_code: customerInfo.zipCode,
        }),
        motivationMessage: motivationMessage || '',
        project: '605Wells Kingdom Builder',
      },
      receipt_email: customerInfo.email,
    };

    // If it's a monthly donation, we'll need to create a subscription instead
    if (donationType === 'monthly') {
      // For monthly donations, we'll create a subscription
      // First, create or retrieve customer
      const customer = await stripe.customers.create({
        email: customerInfo.email,
        name: `${customerInfo.firstName} ${customerInfo.lastName}`,
        phone: customerInfo.phone,
        address: {
          line1: customerInfo.address,
          city: customerInfo.city,
          state: customerInfo.state,
          postal_code: customerInfo.zipCode,
          country: 'US',
        },
        metadata: {
          motivationMessage: motivationMessage || '',
          project: '605Wells Kingdom Builder',
        },
      });

      // Create a product for the monthly donation
      const product = await stripe.products.create({
        name: '605 Wells Kingdom Builder - Monthly Support',
        description: 'Monthly recurring donation to support 605 Wells transformation project',
      });

      // Create a price for the monthly donation
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: donationAmount,
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });

      // Create a subscription with payment intent
      const subscription = await stripe.subscriptions.create({
        customer: customer.id,
        items: [{
          price: price.id,
        }],
        payment_behavior: 'default_incomplete',
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription',
        },
        expand: ['latest_invoice.payment_intent'],
      });

      // Type the expanded invoice properly
      const invoice = subscription.latest_invoice as Stripe.Invoice & {
        payment_intent: Stripe.PaymentIntent | string;
      };
      
      // Handle the payment intent properly
      if (!invoice.payment_intent) {
        throw new Error('Payment intent not found on invoice');
      }
      
      // payment_intent can be either a string ID or the expanded object
      let clientSecret: string;
      if (typeof invoice.payment_intent === 'string') {
        // If it's just an ID, we need to retrieve it
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
        clientSecret = paymentIntent.client_secret!;
      } else {
        // It's already the expanded PaymentIntent object
        clientSecret = invoice.payment_intent.client_secret!;
      }

      return NextResponse.json({
        clientSecret,
        subscriptionId: subscription.id,
        customerId: customer.id,
      });
    } else {
      // One-time donation
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    return NextResponse.json(
      { error: 'Error creating payment intent' },
      { status: 500 }
    );
  }
} 