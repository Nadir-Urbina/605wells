import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';
import { isAdminAuthenticated } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request);
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Fetch all ministry session requests from Sanity
    const sessionRequests = await client.fetch(
      `*[_type == "ministrySessionRequest"] | order(submissionDate desc) {
        _id,
        personalInfo,
        ministryRequested,
        salvationExperience,
        localChurch,
        baptizedInHolySpirit,
        reasonForMinistry,
        availability,
        submissionDate,
        status,
        scheduledDate,
        notes
      }`
    );

    return NextResponse.json({
      sessionRequests,
      total: sessionRequests.length
    });

  } catch (error) {
    console.error('Error fetching ministry session requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session requests' },
      { status: 500 }
    );
  }
}
