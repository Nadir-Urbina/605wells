import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Initialize Stripe only if the secret key is available
const getStripeInstance = () => {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  
  return new Stripe(secretKey, {
    apiVersion: '2024-06-20' as Stripe.LatestApiVersion, // 🔥 USE STABLE API VERSION
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

    const { amount, donationType, customerInfo, motivationMessage, isCustomAmount } = await request.json();

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

    if (donationType === 'monthly') {
      console.log('Creating monthly subscription for:', customerInfo.email);
      console.log('Is custom amount:', isCustomAmount);

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
          customAmount: isCustomAmount ? 'true' : 'false',
        },
      });

      console.log('Customer created:', customer.id);

      // Handle custom amounts differently - create dynamic price
      if (isCustomAmount) {
        console.log('Creating custom monthly price for amount:', donationAmount / 100);
        return createSubscriptionWithCustomAmount(stripe, customer.id, donationAmount);
      }

      // Get the appropriate price ID for standard amounts
      const priceId = getPriceIdForAmount(donationAmount / 100);

      if (!priceId) {
        throw new Error(`No price configured for amount $${donationAmount / 100}. Please use one of: $60, $120, $180, $240`);
      }

      return createSubscriptionWithPrice(stripe, customer.id, priceId);
    } else {
      // One-time donation
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

// Helper function to create subscription with custom amount (dynamic pricing)
async function createSubscriptionWithCustomAmount(stripe: Stripe, customerId: string, amountInCents: number) {
  console.log('Creating custom subscription with dynamic price:', amountInCents / 100);

  try {
    // Create a custom product for this Kingdom Builder
    const product = await stripe.products.create({
      name: `Kingdom Builder - Custom $${amountInCents / 100}/month`,
      metadata: {
        project: '605Wells Kingdom Builder',
        customAmount: 'true',
      },
    });

    console.log('✅ Custom product created:', product.id);

    // Create a price for this product
    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amountInCents,
      currency: 'usd',
      recurring: {
        interval: 'month',
      },
      metadata: {
        project: '605Wells Kingdom Builder',
        customAmount: 'true',
        amount: (amountInCents / 100).toString(),
      },
    });

    console.log('✅ Custom price created:', price.id);

    // Now create the subscription with this custom price
    return createSubscriptionWithPrice(stripe, customerId, price.id);

  } catch (error) {
    console.error('❌ Custom subscription creation failed:', error);
    throw error;
  }
}

// 🔥 COMPLETELY REWRITTEN - Handles the payment intent detection properly
async function createSubscriptionWithPrice(stripe: Stripe, customerId: string, priceId: string) {
  console.log('Creating subscription with price:', priceId);
  
  try {
    // Create subscription
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

    console.log('✅ Subscription created:', subscription.id);
    console.log('📊 Subscription status:', subscription.status);
    
    const invoice = subscription.latest_invoice as Stripe.Invoice & { 
      payment_intent?: Stripe.PaymentIntent | string; 
    };
    
    if (!invoice) {
      throw new Error('No latest invoice found on subscription');
    }

    if (!invoice.id) {
      throw new Error('Invoice ID is missing');
    }

    console.log('📄 Invoice ID:', invoice.id);
    console.log('📄 Invoice status:', invoice.status);
    console.log('📄 Payment intent exists:', !!invoice.payment_intent);

    // 🔥 NEW APPROACH: Always try to find the payment intent
    let clientSecret: string | null = null;
    
    // Method 1: Check if payment intent is already on the invoice
    if (invoice.payment_intent) {
      console.log('✅ Method 1: Payment intent found on invoice');
      
      if (typeof invoice.payment_intent === 'string') {
        const paymentIntent = await stripe.paymentIntents.retrieve(invoice.payment_intent);
        clientSecret = paymentIntent.client_secret;
      } else {
        clientSecret = invoice.payment_intent.client_secret;
      }
    }
    
    // Method 2: If not found, retrieve the invoice fresh (timing issue fix)
    if (!clientSecret) {
      console.log('🔄 Method 2: Retrieving invoice fresh to check for payment intent...');
      
      const freshInvoice = await stripe.invoices.retrieve(invoice.id, {
        expand: ['payment_intent'],
      }) as Stripe.Response<Stripe.Invoice> & { 
        payment_intent?: Stripe.PaymentIntent | string; 
      };
      
      console.log('📄 Fresh invoice payment intent exists:', !!freshInvoice.payment_intent);
      
      if (freshInvoice.payment_intent) {
        if (typeof freshInvoice.payment_intent === 'string') {
          const paymentIntent = await stripe.paymentIntents.retrieve(freshInvoice.payment_intent);
          clientSecret = paymentIntent.client_secret;
          console.log('✅ Found payment intent on fresh invoice retrieve');
        } else {
          clientSecret = freshInvoice.payment_intent.client_secret;
          console.log('✅ Found payment intent object on fresh invoice');
        }
      }
    }
    
    // Method 3: Search for payment intents for this customer/amount (last resort)
    if (!clientSecret) {
      console.log('🔍 Method 3: Searching for recent payment intents...');
      
      const paymentIntents = await stripe.paymentIntents.list({
        customer: customerId,
        limit: 5,
      });
      
      // Look for a payment intent with the right amount that was just created
      const matchingPI = paymentIntents.data.find(pi => 
        pi.amount === invoice.amount_due && 
        pi.created > (Date.now() / 1000) - 300 // Created in last 5 minutes
      );
      
      if (matchingPI) {
        clientSecret = matchingPI.client_secret;
        console.log('✅ Found matching payment intent:', matchingPI.id);
        
        // Link it to the invoice for future reference
        await stripe.paymentIntents.update(matchingPI.id, {
          metadata: {
            invoice_id: invoice.id,
            subscription_id: subscription.id,
          }
        });
      }
    }
    
    // Method 4: Create a manual payment intent (absolute fallback)
    if (!clientSecret) {
      console.log('🛠️ Method 4: Creating manual payment intent as fallback...');
      
      const manualPaymentIntent = await stripe.paymentIntents.create({
        amount: invoice.amount_due,
        currency: 'usd',
        customer: customerId,
        metadata: {
          subscription_id: subscription.id,
          invoice_id: invoice.id,
          project: '605Wells Kingdom Builder',
          donationType: 'monthly',
          manual_creation: 'true',
        },
      });
      
      clientSecret = manualPaymentIntent.client_secret;
      console.log('✅ Manual payment intent created:', manualPaymentIntent.id);
    }
    
    if (!clientSecret) {
      throw new Error('Unable to create or find payment intent for subscription');
    }
    
    console.log('🎉 Successfully obtained client secret');

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
      customerId: customerId,
    });
    
  } catch (error) {
    console.error('❌ Subscription creation failed:', error);
    throw error;
  }
}