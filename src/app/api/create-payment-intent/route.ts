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

// Pre-defined price IDs for each donation amount
const PRICE_IDS = {
  monthly: {
    60: process.env.STRIPE_PRICE_ID_MONTHLY_60,   
    120: process.env.STRIPE_PRICE_ID_MONTHLY_120,  
    180: process.env.STRIPE_PRICE_ID_MONTHLY_180, 
    240: process.env.STRIPE_PRICE_ID_MONTHLY_240, 
  }
};

export async function POST(request: NextRequest) {
  try {
    // Get Stripe instance with proper error handling
    const stripe = getStripeInstance();
    
    const { amount, donationType, customerInfo, motivationMessage } = await request.json();

    // Validate amount
    const donationAmount = Math.round(amount * 100); // Convert to cents
    const minAmount = 1 * 100; // $1 minimum
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

    if (donationType === 'monthly') {
      console.log('Creating monthly subscription for:', customerInfo.email);
      
      // Create customer
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
          motivationMessage: (motivationMessage || '').substring(0, 500),
          project: '605Wells Kingdom Builder',
          donationType: donationType,
          amount: (donationAmount / 100).toString(),
        },
      });
      
      console.log('Customer created:', customer.id);

      // Get the appropriate price ID for this amount
      const priceId = getPriceIdForAmount(donationAmount / 100);
      
      if (!priceId) {
        throw new Error(`No price configured for amount $${donationAmount / 100}. Please use one of: $60, $120, $180, $240`);
      }

      return createSubscriptionWithPrice(stripe, customer.id, priceId);
    } else {
      // One-time donation
      const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
      });
    }
  } catch (error) {
    console.error('Error creating payment intent:', error);
    
    // Log more details about the error
    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    
    return NextResponse.json(
      { 
        error: 'Error creating payment intent',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Helper function to get price ID for standard amounts
function getPriceIdForAmount(amount: number): string | null {
  const standardAmounts = [60, 120, 180, 240];
  
  if (standardAmounts.includes(amount)) {
    return PRICE_IDS.monthly[amount as keyof typeof PRICE_IDS.monthly] || null;
  }
  
  return null;
}

// Simplified subscription creation - THE KEY FIX
async function createSubscriptionWithPrice(stripe: Stripe, customerId: string, priceId: string) {
  console.log('Creating subscription with price:', priceId);
  
  // Create subscription - this is the CORRECT way
  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      payment_method_types: ['card'],
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      project: '605Wells Kingdom Builder',
      donationType: 'monthly',
    },
  });

  console.log('Subscription created:', subscription.id);
  
  // Get the payment intent from the subscription
  const invoice = subscription.latest_invoice as Stripe.Invoice & { 
    payment_intent?: Stripe.PaymentIntent | string; 
  };
  
  if (!invoice) {
    throw new Error('No latest invoice found on subscription');
  }

  console.log('Invoice status:', invoice.status);
  console.log('Invoice ID:', invoice.id);

  // The key fix: Handle the payment intent properly without refinalizing
  let clientSecret: string;
  
  if (invoice.payment_intent) {
    // Payment intent exists - extract client secret
    if (typeof invoice.payment_intent === 'string') {
      const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
      clientSecret = paymentIntent.client_secret!;
      console.log('Retrieved payment intent client secret');
    } else {
      clientSecret = invoice.payment_intent.client_secret!;
      console.log('Extracted payment intent client secret from object');
    }
  } else {
    // This should rarely happen with the correct setup
    console.log('No payment intent on invoice - this is unexpected');
    
    // Only try to finalize if the invoice is actually in draft status
    if (invoice.status === 'draft') {
      if (!invoice.id) {
        throw new Error('Invoice ID is missing');
      }
      console.log('Invoice is draft, finalizing...');
      const finalizedInvoice = await stripe.invoices.finalizeInvoice(invoice.id) as Stripe.Invoice & { 
        payment_intent?: Stripe.PaymentIntent | string; 
      };
      
      if (finalizedInvoice.payment_intent) {
        if (typeof finalizedInvoice.payment_intent === 'string') {
          const paymentIntent = await stripe.paymentIntents.retrieve(finalizedInvoice.payment_intent);
          clientSecret = paymentIntent.client_secret!;
        } else {
          clientSecret = finalizedInvoice.payment_intent.client_secret!;
        }
      } else {
        throw new Error('Failed to create payment intent after finalizing invoice');
      }
    } else {
      throw new Error(`Invoice is in ${invoice.status} status and has no payment intent`);
    }
  }
  
  if (!clientSecret) {
    throw new Error('Failed to extract client secret from payment intent');
  }
  
  console.log('Successfully extracted client secret');

  return NextResponse.json({
    clientSecret,
    subscriptionId: subscription.id,
    customerId: subscription.customer as string,
  });
}