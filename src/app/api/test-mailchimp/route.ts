import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.MAILCHIMP_API_KEY;
    const audienceId = process.env.MAILCHIMP_AUDIENCE_ID;
    const serverPrefix = process.env.MAILCHIMP_SERVER_PREFIX || 'us1';

    if (!apiKey || !audienceId) {
      return NextResponse.json({
        status: 'error',
        message: 'Mailchimp credentials not configured',
        config: {
          hasApiKey: !!apiKey,
          hasAudienceId: !!audienceId,
          serverPrefix: serverPrefix
        }
      });
    }

    // Test API connection
    const testUrl = `https://${serverPrefix}.api.mailchimp.com/3.0/lists/${audienceId}`;
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const listData = await response.json();
      return NextResponse.json({
        status: 'success',
        message: 'Mailchimp connection successful',
        listInfo: {
          name: listData.name,
          memberCount: listData.stats.member_count,
          id: listData.id
        }
      });
    } else {
      const errorData = await response.json();
      return NextResponse.json({
        status: 'error',
        message: 'Mailchimp API error',
        details: errorData
      }, { status: response.status });
    }
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      message: 'Error testing Mailchimp connection',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 