import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminSession } from '@/lib/auth';
import { cookies } from 'next/headers';
import { createBooking, bookTimeSlot, updateQueueEntry, getQueueEntry } from '@/lib/firestore-admin';
import { client } from '@/lib/sanity';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('admin-session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const admin = verifyAdminSession(sessionToken);

    if (!admin) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { queueEntryId, teamMemberId, scheduledDate, scheduledTime } = await request.json();

    if (!queueEntryId || !teamMemberId || !scheduledDate || !scheduledTime) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch queue entry from Firestore
    const queueEntry = await getQueueEntry(queueEntryId);

    if (!queueEntry) {
      return NextResponse.json(
        { error: 'Queue entry not found' },
        { status: 404 }
      );
    }

    if (queueEntry.status !== 'pending') {
      return NextResponse.json(
        { error: 'Queue entry is no longer pending' },
        { status: 400 }
      );
    }

    // Fetch ministry type from Sanity to get duration
    const ministryType = await client.fetch(
      `*[_type == "ministryType" && _id == $ministryTypeId][0] {
        _id,
        title,
        averageDuration
      }`,
      { ministryTypeId: queueEntry.ministryType }
    );

    if (!ministryType) {
      return NextResponse.json(
        { error: 'Ministry type not found' },
        { status: 404 }
      );
    }

    // Fetch team member name from Sanity
    const teamMember = await client.fetch(
      `*[_type == "teamMember" && _id == $teamMemberId][0] {
        firstName,
        lastName
      }`,
      { teamMemberId }
    );

    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }

    const teamMemberName = `${teamMember.firstName} ${teamMember.lastName}`;

    // Create booking in Firestore
    const bookingData = {
      ministryType: queueEntry.ministryType,
      ministryTypeTitle: queueEntry.ministryTypeTitle,
      teamMemberId,
      teamMemberName,
      attendeeInfo: queueEntry.attendeeInfo,
      scheduledDate,
      scheduledTime,
      duration: ministryType.averageDuration,
      status: 'scheduled' as const,
      attendanceType: 'free' as const,
      rescheduleCount: 0,
      rescheduleHistory: [],
      // Copy intake form if it exists
      intakeForm: queueEntry.intakeForm,
    };

    const bookingId = await createBooking(bookingData);
    console.log('✅ Booking created for queue assignment:', bookingId);

    // Update availability slot to mark as booked
    try {
      await bookTimeSlot(teamMemberId, scheduledDate, scheduledTime, bookingId);
      console.log('✅ Availability slot marked as booked');
    } catch (availabilityError) {
      console.error('⚠️ Failed to update availability slot:', availabilityError);
      // Continue - booking is created, just log the warning
    }

    // Create Daily.co video meeting room
    let dailyMeetingData = null;
    try {
      const { createDailyRoom, formatMeetingForFirestore } = await import('@/lib/daily');
      const { updateBooking } = await import('@/lib/firestore-admin');

      // Parse scheduled date and time to create startTime Date object
      const [year, month, day] = scheduledDate.split('-').map(Number);
      const [time, period] = scheduledTime.split(' ');
      const [hours, minutes] = time.split(':').map(Number);
      let hour24 = hours;
      if (period === 'PM' && hours !== 12) hour24 += 12;
      if (period === 'AM' && hours === 12) hour24 = 0;

      const startTime = new Date(year, month - 1, day, hour24, minutes);

      const dailyRoom = await createDailyRoom({
        sessionName: `${queueEntry.ministryTypeTitle} - ${teamMemberName} & ${queueEntry.attendeeInfo.firstName} ${queueEntry.attendeeInfo.lastName}`,
        startTime,
        duration: ministryType.averageDuration,
        attendeeName: `${queueEntry.attendeeInfo.firstName} ${queueEntry.attendeeInfo.lastName}`,
        teamMemberName,
      });

      dailyMeetingData = formatMeetingForFirestore(dailyRoom);
      console.log('✅ Daily.co meeting room created:', dailyRoom.url);

      // Update booking with meeting information
      await updateBooking(bookingId, {
        videoMeeting: dailyMeetingData,
      });
      console.log('✅ Booking updated with Daily.co meeting details');
    } catch (dailyError) {
      console.error('⚠️ Failed to create Daily.co meeting:', dailyError);
      // Don't fail the entire process if Daily.co fails
    }

    // Update queue entry status
    await updateQueueEntry(queueEntryId, {
      status: 'assigned',
      assignedBookingId: bookingId,
    });

    console.log('✅ Queue entry updated to assigned status');

    // Send notification email to user with booking details and Daily.co meeting link
    if (dailyMeetingData?.joinUrl) {
      try {
        const { sendQueueAssignmentNotification } = await import('@/lib/resend');

        await sendQueueAssignmentNotification({
          email: queueEntry.attendeeInfo.email,
          firstName: queueEntry.attendeeInfo.firstName,
          lastName: queueEntry.attendeeInfo.lastName,
          ministryTypeTitle: queueEntry.ministryTypeTitle,
          teamMemberName,
          scheduledDate,
          scheduledTime,
          duration: ministryType.averageDuration,
          meetingLink: dailyMeetingData.joinUrl,
          bookingId,
          intakeFormLink: `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.605wells.com'}/virtual-hub/intake/${bookingId}`,
        });

        console.log('✅ Queue assignment notification email sent to:', queueEntry.attendeeInfo.email);
      } catch (emailError) {
        console.error('⚠️ Failed to send queue assignment email:', emailError);
        // Don't fail the entire process if email fails
      }
    }

    return NextResponse.json({
      success: true,
      bookingId,
      meetingUrl: dailyMeetingData?.joinUrl || null,
      message: 'Queue entry assigned successfully',
    });
  } catch (error) {
    console.error('Error assigning queue entry:', error);
    return NextResponse.json(
      {
        error: 'Failed to assign queue entry',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
