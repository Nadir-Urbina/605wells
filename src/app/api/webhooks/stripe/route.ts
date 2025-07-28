import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendKingdomBuilderWelcomeEmail, sendOneTimeDonorThankYou } from '@/lib/resend';

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
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice & { 
          subscription?: string;
          amount_paid?: number;
        });
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice & { 
          subscription?: string;
          hosted_invoice_url?: string | null;
          amount_due?: number;
        });
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

async function handlePaymentSucceeded(invoice: Stripe.Invoice & { 
  subscription?: string;
  amount_paid?: number;
}) {
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
      amount: (invoice.amount_paid || 0) / 100,
      type: 'monthly',
      subscriptionId: subscription.id,
    });
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice & { 
  subscription?: string;
  hosted_invoice_url?: string | null;
  amount_due?: number;
}) {
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
      amount: (invoice.amount_due || 0) / 100,
      invoiceUrl: invoice.hosted_invoice_url || '',
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
  
  try {
    // Get email from receipt_email or customer email
    let email = paymentIntent.receipt_email;
    let customerName = paymentIntent.metadata.customerName || 'Friend';

    // If no receipt_email, try to get from customer
    if (!email && paymentIntent.customer) {
      const customer = await stripe.customers.retrieve(paymentIntent.customer as string) as Stripe.Customer;
      email = customer.email;
      customerName = customer.name || customerName;
    }

    // Get email from metadata as backup
    if (!email) {
      email = paymentIntent.metadata.customerEmail;
    }

    if (email) {
      console.log('Sending one-time donation thank you email to:', email);
      
      await sendThankYouEmail({
        email: email,
        name: customerName,
        amount: paymentIntent.amount / 100,
        type: 'one-time',
        paymentIntentId: paymentIntent.id,
      });
    } else {
      console.warn('No email found for one-time donation:', paymentIntent.id);
    }
  } catch (error) {
    console.error('Error handling one-time payment success:', error);
  }
}
  
  // Email helper functions
async function sendThankYouEmail(data: {
  email: string;
  name: string;
  amount: number;
  type: 'monthly' | 'one-time';
  subscriptionId?: string;
  paymentIntentId?: string;
}) {
  console.log(`Sending thank you email to ${data.email} for ${data.type} donation of $${data.amount}`);
  
  try {
    // Parse first name and last name
    const nameParts = data.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    if (data.type === 'monthly' && data.subscriptionId) {
      // Send Kingdom Builder welcome email
      await sendKingdomBuilderWelcomeEmail({
        email: data.email,
        firstName,
        lastName,
        amount: data.amount,
        transactionId: data.paymentIntentId || 'N/A',
        subscriptionId: data.subscriptionId,
      });
      console.log('✅ Kingdom Builder welcome email sent successfully');
    } else {
      // Send one-time donor thank you email
      await sendOneTimeDonorThankYou({
        email: data.email,
        firstName,
        lastName,
        amount: data.amount,
        transactionId: data.paymentIntentId || 'N/A',
      });
      console.log('✅ One-time donor thank you email sent successfully');
    }
  } catch (error) {
    console.error('❌ Failed to send thank you email:', error);
    // Don't throw error - we don't want email failures to break payment processing
  }
}

async function sendPaymentFailedEmail(data: {
  email: string;
  name: string;
  amount: number;
  invoiceUrl: string;
}) {
  console.log(`Sending payment failed email to ${data.email}`);
  
  // TODO: Implement payment failed email template if needed
  // For now, just log the failure
  console.log('Payment failed email placeholder - implement if needed');
} 