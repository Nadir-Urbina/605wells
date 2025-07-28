import { NextRequest, NextResponse } from 'next/server';
import { sendKingdomBuilderWelcomeEmail, sendOneTimeDonorThankYou } from '@/lib/resend';

export async function POST(request: NextRequest) {
  try {
    const { type, email, firstName, lastName, amount } = await request.json();

    if (!email || !firstName || !lastName || !amount || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: email, firstName, lastName, amount, type' },
        { status: 400 }
      );
    }

    console.log(`Testing ${type} email to: ${email}`);

    if (type === 'kingdom-builder') {
      // Test Kingdom Builder welcome email
      const result = await sendKingdomBuilderWelcomeEmail({
        email,
        firstName,
        lastName,
        amount: parseFloat(amount),
        transactionId: `test_${Date.now()}`,
        subscriptionId: `sub_test_${Date.now()}`,
      });

      return NextResponse.json({
        success: true,
        message: 'Kingdom Builder welcome email sent!',
        emailId: result.id
      });
      
    } else if (type === 'one-time') {
      // Test one-time donor thank you email
      const result = await sendOneTimeDonorThankYou({
        email,
        firstName,
        lastName,
        amount: parseFloat(amount),
        transactionId: `test_${Date.now()}`,
      });

      return NextResponse.json({
        success: true,
        message: 'One-time donor thank you email sent!',
        emailId: result.id
      });
      
    } else {
      return NextResponse.json(
        { error: 'Invalid type. Use "kingdom-builder" or "one-time"' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send test email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to show usage instructions
export async function GET() {
  return NextResponse.json({
    message: 'Email Test Endpoint',
    usage: {
      method: 'POST',
      body: {
        type: '"kingdom-builder" or "one-time"',
        email: 'test@example.com',
        firstName: 'John',
        lastName: 'Doe',
        amount: 120
      }
    },
    examples: [
      {
        description: 'Test Kingdom Builder welcome email',
        body: {
          type: 'kingdom-builder',
          email: 'test@example.com',
          firstName: 'John',
          lastName: 'Doe',
          amount: 120
        }
      },
      {
        description: 'Test one-time donor thank you email',
        body: {
          type: 'one-time',
          email: 'test@example.com',
          firstName: 'Jane',
          lastName: 'Smith',
          amount: 50
        }
      }
    ]
  });
} 