import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ministryTypeId: string }> }
) {
  try {
    const { ministryTypeId } = await params;

    if (!ministryTypeId) {
      return NextResponse.json(
        { error: 'Ministry type ID is required' },
        { status: 400 }
      );
    }

    // Fetch ministry type from Sanity
    const ministryType = await client.fetch(
      `*[_type == "ministryType" && _id == $ministryTypeId][0] {
        _id,
        title,
        description,
        intakeFormQuestions
      }`,
      { ministryTypeId }
    );

    if (!ministryType) {
      return NextResponse.json(
        { error: 'Ministry type not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(ministryType);
  } catch (error) {
    console.error('Error fetching ministry type:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ministry type',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
