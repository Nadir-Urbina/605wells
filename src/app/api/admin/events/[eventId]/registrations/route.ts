import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { client, type SanityEventRegistration } from '@/lib/sanity'

interface Props {
  params: Promise<{ eventId: string }>
}

export async function GET(request: NextRequest, { params }: Props) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { eventId } = await params

    // Fetch event details
    const event = await client.fetch(`
      *[_type == "event" && _id == $eventId][0] {
        _id,
        title,
        slug,
        price,
        eventSchedule,
        location,
        registrationType,
        registrationLimit,
        registrationClosed
      }
    `, { eventId })

    if (!event) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      )
    }

    // Fetch all registrations for this event
    const registrations = await client.fetch(`
      *[_type == "eventRegistration" && event._ref == $eventId] | order(registrationDate desc) {
        _id,
        attendee,
        customer,
        payment,
        attendanceType,
        registrationDate,
        status,
        emailsSent,
        notes
      }
    `, { eventId })

    // Calculate detailed stats
    const stats = {
      totalRegistrations: registrations.length,
      confirmedRegistrations: registrations.filter((r: SanityEventRegistration) => r.status === 'confirmed').length,
      cancelledRegistrations: registrations.filter((r: SanityEventRegistration) => r.status === 'cancelled').length,
      checkedInRegistrations: registrations.filter((r: SanityEventRegistration) => r.status === 'checked-in').length,
      noShowRegistrations: registrations.filter((r: SanityEventRegistration) => r.status === 'no-show').length,
      totalRevenue: registrations
        .filter((r: SanityEventRegistration) => r.status !== 'cancelled')
        .reduce((sum: number, r: SanityEventRegistration) => sum + (r.payment?.amount || 0), 0),
      averageTicketPrice: registrations.length > 0 
        ? registrations
            .filter((r: SanityEventRegistration) => r.status !== 'cancelled')
            .reduce((sum: number, r: SanityEventRegistration) => sum + (r.payment?.amount || 0), 0) / 
          registrations.filter((r: SanityEventRegistration) => r.status !== 'cancelled').length
        : 0,
      registrationsByStatus: registrations.reduce((acc: Record<string, number>, r: SanityEventRegistration) => {
        acc[r.status || 'unknown'] = (acc[r.status || 'unknown'] || 0) + 1
        return acc
      }, {}),
      registrationsByDay: registrations.reduce((acc: Record<string, number>, r: SanityEventRegistration) => {
        const date = new Date(r.registrationDate).toLocaleDateString()
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {}),
    }

    return NextResponse.json({
      event,
      registrations,
      stats
    })

  } catch (error) {
    console.error('Error fetching event registrations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
