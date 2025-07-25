import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, phone, address, city, state, zipCode, donationType, amount } = await request.json();

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

    if (!apiKey || !audienceId) {
      console.error('Mailchimp credentials not configured');
      return NextResponse.json(
        { error: 'Mailchimp not configured' },
        { status: 500 }
      );
    }

    const url = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members`;

    const data = {
      email_address: email,
      status: 'subscribed',
      merge_fields: {
        FNAME: firstName,
        LNAME: lastName,
        PHONE: phone,
        ADDRESS: {
          addr1: address,
          city: city,
          state: state,
          zip: zipCode,
          country: 'US'
        }
      },
      tags: [
        'Kingdom Builder',
        '605 Wells',
        donationType === 'monthly' ? 'Monthly Donor' : 'One-Time Donor',
        `Donation-$${amount}`
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (response.ok) {
      return NextResponse.json({ success: true });
    } else {
      const errorData = await response.json();
      console.error('Mailchimp error:', errorData);
      
      // If the email is already subscribed, that's ok
      if (errorData.title === 'Member Exists') {
        return NextResponse.json({ success: true, message: 'Already subscribed' });
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe to mailing list' },
        { status: response.status }
      );
    }
  } catch (error) {
    console.error('Error subscribing to Mailchimp:', error);
    return NextResponse.json(
      { error: 'Error subscribing to mailing list' },
      { status: 500 }
    );
  }
} 