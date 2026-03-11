import { NextRequest, NextResponse } from 'next/server';
import { client } from '@/lib/sanity';

export async function GET(request: NextRequest) {
  try {
    // Fetch all active ministry types from Sanity
    const ministryTypes = await client.fetch(
      `*[_type == "ministryType" && active == true] | order(order asc, title asc) {
        _id,
        title,
        slug,
        description,
        averageDuration,
        costType,
        price,
        icon,
        order
      }`
    );

    return NextResponse.json({
      ministryTypes,
    });
  } catch (error) {
    console.error('Error fetching ministry types:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch ministry types',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
