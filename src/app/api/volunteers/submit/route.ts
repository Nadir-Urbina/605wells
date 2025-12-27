import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity';

// Define the ministry availability type
interface MinistryAvailability {
  ministryArea: string;
  daysOfWeek: string[];
  frequency: string;
  timePreferences: string[];
}

// Define the volunteer submission type
interface VolunteerSubmission {
  fullName: string;
  email: string;
  phone: string;
  ministryAvailabilities: MinistryAvailability[];
}

export async function POST(request: NextRequest) {
  try {
    const data: VolunteerSubmission = await request.json();

    // Validate required fields
    if (!data.fullName || !data.email || !data.phone) {
      return NextResponse.json(
        { error: 'Full name, email, and phone number are required' },
        { status: 400 }
      );
    }

    // Validate ministry availabilities
    if (!data.ministryAvailabilities || data.ministryAvailabilities.length === 0) {
      return NextResponse.json(
        { error: 'Please configure at least one ministry area with availability' },
        { status: 400 }
      );
    }

    // Validate each ministry availability
    for (const ministry of data.ministryAvailabilities) {
      if (!ministry.ministryArea) {
        return NextResponse.json(
          { error: 'Each ministry must have an area specified' },
          { status: 400 }
        );
      }
      if (!ministry.daysOfWeek || ministry.daysOfWeek.length === 0) {
        return NextResponse.json(
          { error: `Please select at least one day for ${ministry.ministryArea}` },
          { status: 400 }
        );
      }
      if (!ministry.frequency) {
        return NextResponse.json(
          { error: `Please select frequency for ${ministry.ministryArea}` },
          { status: 400 }
        );
      }
      if (!ministry.timePreferences || ministry.timePreferences.length === 0) {
        return NextResponse.json(
          { error: `Please select at least one time preference for ${ministry.ministryArea}` },
          { status: 400 }
        );
      }
    }

    // Create volunteer document in Sanity
    const volunteerData = {
      _type: 'volunteer',
      personalInfo: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
      ministryAvailabilities: data.ministryAvailabilities,
      submissionDate: new Date().toISOString(),
      status: 'new',
    };

    const savedVolunteer = await writeClient.create(volunteerData);
    console.log('✅ Volunteer submission saved to Sanity:', savedVolunteer._id);

    return NextResponse.json({
      success: true,
      volunteerId: savedVolunteer._id,
      message: 'Thank you for volunteering! Your submission has been received.',
    });

  } catch (error) {
    console.error('Error processing volunteer submission:', error);

    if (error instanceof Error) {
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }

    return NextResponse.json(
      {
        error: 'Error processing submission',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
