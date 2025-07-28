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

    // Create AbortController for 5-second timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), 5000);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: abortController.signal,
    });

    // Clear timeout if request completes successfully
    clearTimeout(timeoutId);

          if (response.ok) {
        const result = await response.json();
        console.log(`Mailchimp subscription successful for ${donationType} donor:`, result.id);
        return NextResponse.json({ 
          success: true, 
          mailchimp_id: result.id,
          message: `Successfully added ${donationType} donor to Mailchimp`
        });
    } else {
      const errorData = await response.json();
      console.error('Mailchimp error:', errorData);
      
      // If the email is already subscribed, update their tags
              if (errorData.title === 'Member Exists') {
          console.log(`Member exists, updating tags for ${donationType} donor...`);
        
        try {
          // Update existing member with new tags (also with timeout)
          const updateController = new AbortController();
          const updateTimeoutId = setTimeout(() => updateController.abort(), 5000);
          
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
            signal: updateController.signal,
          });

          clearTimeout(updateTimeoutId);
        
                    if (updateResponse.ok) {
              console.log(`Tags updated for existing ${donationType} donor`);
              return NextResponse.json({ 
                success: true, 
                message: `Tags updated for existing ${donationType} donor`,
                updated: true
              });
          } else {
            const updateError = await updateResponse.json();
            console.error('Failed to update tags:', updateError);
            return NextResponse.json({ 
              success: true,  // Still consider it success since user is already subscribed
              message: 'Already subscribed but failed to update tags',
              updated: false
            });
          }
        } catch (updateError) {
          console.error('Update tags timeout or error:', updateError);
          return NextResponse.json({ 
            success: true,  // Still consider it success since user is already subscribed
            message: 'Already subscribed - tag update timed out',
            timeout: true,
            updated: false
          });
        }
      }
      
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to subscribe to mailing list',
        mailchimp_error: errorData.title,
        details: errorData.detail 
      }, { status: 400 });
    }
  } catch (error) {
    console.error('Error subscribing to Mailchimp:', error);
    
    // Handle timeout errors specifically
    if (error instanceof Error && error.name === 'AbortError') {
      console.warn('⚠️ Mailchimp API timeout (5 seconds)');
      return NextResponse.json({ 
        success: false, 
        error: 'Mailchimp API timeout',
        timeout: true,
        message: 'Request timed out after 5 seconds'
      }, { status: 408 });
    }
    
    // Handle other errors
    return NextResponse.json({ 
      success: false, 
      error: 'Error subscribing to mailing list',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 