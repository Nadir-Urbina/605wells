import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-06-30.basil',
});

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature')!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Received webhook event:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCancelled(event.data.object as Stripe.Subscription);
        break;

      case 'payment_intent.succeeded':
        await handleOneTimePaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Payment succeeded for invoice:', invoice.id);
  
  if (invoice.subscription) {
    // This is a subscription payment
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    console.log('Monthly donation payment succeeded for:', customer.email);
    
    // Here you would:
    // 1. Update your database with the successful payment
    // 2. Send a thank you email
    // 3. Update any analytics/reporting
    
    await sendThankYouEmail({
      email: customer.email!,
      name: customer.name!,
      amount: invoice.amount_paid / 100,
      type: 'monthly',
      subscriptionId: subscription.id,
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Payment failed for invoice:', invoice.id);
  
  if (invoice.subscription) {
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
    const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
    
    console.log('Monthly donation payment failed for:', customer.email);
    
    // Here you would:
    // 1. Log the failed payment
    // 2. Send a payment failed notification
    // 3. Implement retry logic if needed
    
    await sendPaymentFailedEmail({
      email: customer.email!,
      name: customer.name!,
      amount: invoice.amount_due / 100,
      invoiceUrl: invoice.hosted_invoice_url!,
    });
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('New subscription created:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
  
  // Here you would:
  // 1. Store subscription details in your database
  // 2. Send welcome email with Kingdom Builder benefits
  // 3. Add to any CRM/email lists
  
  console.log('New Kingdom Builder:', customer.email);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Subscription updated:', subscription.id);
  
  // Handle subscription changes (amount updates, paused, etc.)
  // Update your database accordingly
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  console.log('Subscription cancelled:', subscription.id);
  
  const customer = await stripe.customers.retrieve(subscription.customer as string) as Stripe.Customer;
  
  // Here you would:
  // 1. Update subscription status in your database
  // 2. Send cancellation confirmation
  // 3. Remove Kingdom Builder benefits
  
  console.log('Kingdom Builder cancelled:', customer.email);
}

async function handleOneTimePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
  console.log('One-time payment succeeded:', paymentIntent.id);
  
  // Handle one-time donations
  // Send thank you email, update database, etc.
  
  await sendThankYouEmail({
    email: paymentIntent.receipt_email!,
    name: paymentIntent.metadata.customerName || 'Friend',
    amount: paymentIntent.amount / 100,
    type: 'one-time',
    paymentIntentId: paymentIntent.id,
  });
}

// Email helper functions (implement with your email service)
async function sendThankYouEmail(data: {
  email: string;
  name: string;
  amount: number;
  type: 'monthly' | 'one-time';
  subscriptionId?: string;
  paymentIntentId?: string;
}) {
  console.log(`Sending thank you email to ${data.email} for ${data.type} donation of $${data.amount}`);
  
  // TODO: Implement with your email service (SendGrid, Resend, etc.)
  // Include Kingdom Builder benefits information for monthly donors
}

async function sendPaymentFailedEmail(data: {
  email: string;
  name: string;
  amount: number;
  invoiceUrl: string;
}) {
  console.log(`Sending payment failed email to ${data.email}`);
  
  // TODO: Implement with your email service
  // Include link to update payment method
} 