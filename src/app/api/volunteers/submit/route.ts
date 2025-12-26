import { NextRequest, NextResponse } from 'next/server';
import { writeClient } from '@/lib/sanity';

// Define the volunteer submission type
interface VolunteerSubmission {
  fullName: string;
  email: string;
  phone: string;
  ministryAreas: string[];
  daysOfWeek: string[];
  frequency: string;
  timePreferences: string[];
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

    // Validate arrays
    if (!data.ministryAreas || data.ministryAreas.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one ministry area' },
        { status: 400 }
      );
    }

    if (!data.daysOfWeek || data.daysOfWeek.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one day of the week' },
        { status: 400 }
      );
    }

    if (!data.frequency) {
      return NextResponse.json(
        { error: 'Please select how often you can volunteer' },
        { status: 400 }
      );
    }

    if (!data.timePreferences || data.timePreferences.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one time preference' },
        { status: 400 }
      );
    }

    // Create volunteer document in Sanity
    const volunteerData = {
      _type: 'volunteer',
      personalInfo: {
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
      },
      ministryAreas: data.ministryAreas,
      availability: {
        daysOfWeek: data.daysOfWeek,
        frequency: data.frequency,
        timePreferences: data.timePreferences,
      },
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
