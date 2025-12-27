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

    // Fetch all volunteers from Sanity
    const volunteers = await client.fetch(`
      *[_type == "volunteer"] | order(submissionDate desc) {
        _id,
        personalInfo,
        ministryAvailabilities,
        submissionDate,
        status,
        notes,
        assignments,
        communicationLog
      }
    `);

    return NextResponse.json({
      volunteers,
      total: volunteers.length,
    });

  } catch (error) {
    console.error('Error fetching volunteers:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Error fetching volunteers',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
