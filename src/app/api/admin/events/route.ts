import { NextRequest, NextResponse } from 'next/server'
import { isAdminAuthenticated } from '@/lib/auth'
import { client } from '@/lib/sanity'

interface EventWithStats {
  totalRegistrations?: number;
  totalRevenue?: number;
}

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const isAuthenticated = await isAdminAuthenticated(request)
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all events with registration counts
    const eventsWithStats = await client.fetch(`
      *[_type == "event" && published == true] | order(coalesce(eventSchedule[0].startTime, "9999-12-31T00:00:00Z") desc) {
        _id,
        title,
        slug,
        description,
        featuredImage,
        eventSchedule,
        location,
        price,
        capacity,
        registrationType,
        registrationLimit,
        registrationClosed,
        "totalRegistrations": count(*[_type == "eventRegistration" && event._ref == ^._id && status != "cancelled"]),
        "totalRevenue": math::sum(*[_type == "eventRegistration" && event._ref == ^._id && status != "cancelled"].payment["amount"]),
        "recentRegistrations": *[_type == "eventRegistration" && event._ref == ^._id] | order(registrationDate desc) [0...3] {
          _id,
          attendee,
          registrationDate,
          status,
          "paymentAmount": payment.amount
        }
      }
    `)

    // Calculate overall stats
    const overallStats = {
      totalEvents: eventsWithStats.length,
      totalRegistrations: eventsWithStats.reduce((sum: number, event: EventWithStats) => sum + (event.totalRegistrations || 0), 0),
      totalRevenue: eventsWithStats.reduce((sum: number, event: EventWithStats) => sum + (event.totalRevenue || 0), 0),
      eventsWithRegistrations: eventsWithStats.filter((event: EventWithStats) => (event.totalRegistrations || 0) > 0).length,
    }

    return NextResponse.json({
      events: eventsWithStats,
      stats: overallStats
    })

  } catch (error) {
    console.error('Error fetching admin events:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
