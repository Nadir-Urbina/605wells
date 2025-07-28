import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, firstName, lastName, phone, address, city, state, zipCode, donationType, amount, subscriptionId, customerId } = await request.json();

    console.log('Mailchimp subscription request:', { email, donationType, amount });

    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

    if (!apiKey || !audienceId) {
      console.warn('Mailchimp credentials not configured - skipping email subscription');
      return NextResponse.json(
        { success: true, message: 'Mailchimp not configured' },
        { status: 200 }
      );
    }

    console.log(`Processing ${donationType === 'monthly' ? 'Kingdom Builder' : 'one-time giver'} for Mailchimp:`, email);

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
        },
        AMOUNT: amount,
        SUBID: subscriptionId || '',
        CUSTID: customerId || ''
      },
      tags: donationType === 'monthly' ? [
        'kingdom builders',
        '605 Wells givers'
      ] : [
        'one-time givers',
        '605 Wells givers'
      ]
    };

          console.log(`Sending to Mailchimp with ${donationType} tags:`, { email_address: email, tags: data.tags });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

          if (response.ok) {
        const result = await response.json();
        console.log(`Mailchimp subscription successful for ${donationType} donor:`, result.id);
        return NextResponse.json({ success: true, mailchimp_id: result.id });
    } else {
      const errorData = await response.json();
      console.error('Mailchimp error:', errorData);
      
      // If the email is already subscribed, update their tags
              if (errorData.title === 'Member Exists') {
          console.log(`Member exists, updating tags for ${donationType} donor...`);
        
        // Update existing member with new tags
        const updateUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}/members/${Buffer.from(email.toLowerCase()).toString('hex')}`;
        
        const updateResponse = await fetch(updateUrl, {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags: data.tags.map(tag => ({ name: tag, status: 'active' }))
          }),
        });
        
                  if (updateResponse.ok) {
            console.log(`Tags updated for existing ${donationType} donor`);
            return NextResponse.json({ success: true, message: `Tags updated for existing ${donationType} donor` });
        } else {
          console.error('Failed to update tags:', await updateResponse.json());
          return NextResponse.json({ success: true, message: 'Already subscribed but failed to update tags' });
        }
      }
      
      return NextResponse.json(
        { error: 'Failed to subscribe to mailing list', details: errorData },
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