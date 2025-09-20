import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { sendKingdomBuilderWelcomeEmail, sendOneTimeDonorThankYou, sendEventRegistrationConfirmation, sendOnlineEventRegistrationConfirmation } from '@/lib/resend';
import { createEventRegistration, type SanityEventRegistration, type SanityLivestreamAccess, client, writeClient, eventQueries } from '@/lib/sanity';
import crypto from 'crypto';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-08-27.basil',
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
    // Check if this is an event registration
    if (paymentIntent.metadata.type === 'event_registration') {
      await handleEventRegistrationSuccess(paymentIntent);
      return;
    }

    // Handle regular donation
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

// Removed unused interfaces - using event data directly from Sanity

async function handleEventRegistrationSuccess(paymentIntent: Stripe.PaymentIntent) {
  console.log('Event registration payment succeeded:', paymentIntent.id);
  
  try {
    const metadata = paymentIntent.metadata;
    
    // Look up the event by slug to get the actual document ID and event details
    let eventDocumentId = '';
    let eventData: { _id: string; title: string; eventSchedule?: { startTime?: string; endTime?: string; sessionTitle?: string }[]; location?: { name?: string; address?: string } } | null = null;
    try {
      const eventSlug = metadata.eventId || '';
      const event = await client.fetch(eventQueries.eventBySlug, { slug: eventSlug });
      
      if (!event || !event._id) {
        console.error(`Event not found for slug: ${eventSlug}`);
        return;
      }
      
      eventDocumentId = event._id;
      eventData = event;
      console.log(`✅ Found event: ${event.title} (ID: ${eventDocumentId})`);
    } catch (eventLookupError) {
      console.error('❌ Failed to look up event:', eventLookupError);
      return;
    }
    
    // Extract registration details from metadata and event data
    const attendeeEmail = metadata.attendeeEmail || metadata.customerEmail;
    const attendeeName = metadata.attendeeName || metadata.customerName || 'Attendee';
    const eventTitle = eventData?.title || metadata.eventTitle || 'Event';
    const finalPrice = parseFloat(metadata.finalPrice || '0');
    const isKingdomBuilder = metadata.isKingdomBuilder === 'true';
    const discountApplied = metadata.discountApplied === 'true';
    
    if (!attendeeEmail) {
      console.error('No attendee email found for event registration:', paymentIntent.id);
      return;
    }

    console.log(`Event registration confirmed: ${attendeeName} for ${eventTitle}`);
    
    // Format event schedule data
    let eventDate = 'Date TBD';
    let eventTime = 'Time TBD';
    let eventSchedule: Array<{
      sessionTitle?: string;
      date: string;
      time: string;
      startTime: string;
      endTime: string;
    }> = [];
    
    if (eventData?.eventSchedule && eventData.eventSchedule.length > 0) {
      // Process all sessions
      eventSchedule = eventData.eventSchedule.map((session, index) => {
        if (session.startTime) {
          const startDate = new Date(session.startTime);
          const endDate = new Date(session.endTime!);
          
          return {
            sessionTitle: session.sessionTitle || `Session ${index + 1}`,
            date: startDate.toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            }),
            time: `${startDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })} - ${endDate.toLocaleTimeString('en-US', { 
              hour: 'numeric', 
              minute: '2-digit',
              hour12: true 
            })}`,
            startTime: session.startTime,
            endTime: session.endTime!
          };
        }
        return {
          sessionTitle: `Session ${index + 1}`,
          date: 'Date TBD',
          time: 'Time TBD',
          startTime: '',
          endTime: ''
        };
      });

      // For backward compatibility, set first session as primary date/time
      if (eventSchedule.length > 0 && eventSchedule[0].startTime) {
        eventDate = eventSchedule[0].date;
        eventTime = eventSchedule[0].time;
      }
    }

    // Send event registration confirmation email
    try {
      await sendEventRegistrationConfirmation({
        email: attendeeEmail,
        firstName: attendeeName.split(' ')[0] || '',
        lastName: attendeeName.split(' ').slice(1).join(' ') || '',
        eventTitle,
        eventDate,
        eventTime,
        eventSchedule,
        eventLocation: eventData?.location?.name || 'Location TBD',
        eventAddress: eventData?.location?.address || '',
        finalPrice,
        originalPrice: parseFloat(metadata.originalPrice || finalPrice.toString()),
        isKingdomBuilder,
        discountApplied,
        transactionId: paymentIntent.id,
        registrationInstructions: metadata.registrationInstructions,
        promoCode: metadata.promoCode || undefined,
        promoCodeDiscount: metadata.promoCodeDiscount ? parseFloat(metadata.promoCodeDiscount) : undefined,
      });
      
      console.log('✅ Event registration confirmation email sent to:', attendeeEmail);
    } catch (emailError) {
      console.error('❌ Failed to send registration confirmation email:', emailError);
      // Don't throw error - payment succeeded, email failure shouldn't break the flow
    }
    
    // Log registration details for debugging
    console.log('Registration completed:', {
      eventTitle,
      attendeeName,
      attendeeEmail,
      finalPrice,
      isKingdomBuilder,
      discountApplied,
      paymentIntentId: paymentIntent.id,
    });

    // Create registration record in Sanity
    try {
      const registrationData: SanityEventRegistration = {
        _type: 'eventRegistration',
        event: {
          _type: 'reference',
          _ref: eventDocumentId,
        },
        attendee: {
          firstName: metadata.attendeeFirstName || attendeeName.split(' ')[0] || '',
          lastName: metadata.attendeeLastName || attendeeName.split(' ').slice(1).join(' ') || '',
          email: attendeeEmail,
          phone: metadata.attendeePhone,
        },
        customer: metadata.customerEmail !== attendeeEmail ? {
          firstName: metadata.customerFirstName,
          lastName: metadata.customerLastName,
          email: metadata.customerEmail,
          phone: metadata.customerPhone,
          address: metadata.customerAddress,
          city: metadata.customerCity,
          state: metadata.customerState,
          zipCode: metadata.customerZipCode,
        } : undefined,
        payment: {
          stripePaymentIntentId: paymentIntent.id,
          amount: finalPrice,
          originalPrice: parseFloat(metadata.originalPrice || finalPrice.toString()),
          discountApplied,
          discountAmount: discountApplied ? parseFloat(metadata.originalPrice || '0') - finalPrice : 0,
          paymentMethod: 'card', // All webhook payments are card-based
          status: 'completed',
        },
        registrationDate: new Date().toISOString(),
        status: 'confirmed',
        emailsSent: [{
          type: 'confirmation',
          sentAt: new Date().toISOString(),
          subject: `Registration Confirmation - ${eventTitle}`,
        }],
      };

      const savedRegistration = await createEventRegistration(registrationData);
      console.log('✅ Event registration saved to Sanity');

      // If this is an online registration, create livestream access
      if (metadata.attendanceType === 'online') {
        try {
          const accessToken = crypto.randomBytes(32).toString('hex');
          
          const livestreamAccess: Omit<SanityLivestreamAccess, '_id'> = {
            _type: 'livestreamAccess',
            event: {
              _type: 'reference',
              _ref: eventDocumentId,
            },
            eventRegistration: {
              _type: 'reference',
              _ref: savedRegistration._id,
            },
            accessToken,
            attendeeEmail,
            attendeeName,
            isActive: true,
            createdAt: new Date().toISOString(),
            lastAccessed: undefined,
            accessCount: 0,
          };

          await writeClient.create(livestreamAccess);
          console.log('✅ Livestream access token created for online registration');

          // Send online-specific confirmation email
          await sendOnlineEventRegistrationConfirmation({
            email: attendeeEmail,
            firstName: metadata.attendeeFirstName || attendeeName.split(' ')[0] || '',
            lastName: metadata.attendeeLastName || attendeeName.split(' ').slice(1).join(' ') || '',
            eventTitle,
            eventDate,
            eventTime,
            eventSchedule,
            eventLocation: eventData?.location?.name || 'Location TBD',
            eventAddress: eventData?.location?.address || '',
            registrationInstructions: metadata.registrationInstructions,
            accessToken,
            livestreamUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.605wells.com'}/livestream/${metadata.eventId}?token=${accessToken}`,
            finalPrice,
            originalPrice: parseFloat(metadata.originalPrice || finalPrice.toString()),
            discountApplied,
            promoCode: metadata.promoCode || undefined,
            promoCodeDiscount: metadata.promoCodeDiscount ? parseFloat(metadata.promoCodeDiscount) : undefined,
          });
          
          console.log('✅ Online event registration confirmation email sent to:', attendeeEmail);
          return; // Skip regular email since we sent the online-specific one
        } catch (livestreamError) {
          console.error('❌ Failed to create livestream access:', livestreamError);
          // Continue with regular email flow as fallback
        }
      }
      
    } catch (sanityError) {
      console.error('❌ Failed to save registration to Sanity:', sanityError);
      // Don't throw error - payment succeeded, database failure shouldn't break the flow
    }
    
  } catch (error) {
    console.error('Error handling event registration success:', error);
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