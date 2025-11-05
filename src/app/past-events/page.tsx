import { Metadata } from 'next'
import Link from 'next/link'
import { client, pastEventQueries, urlFor, SanityPastEvent } from '@/lib/sanity'
import Header from '@/components/Header'

export const metadata: Metadata = {
  title: 'Past Events | 605 Wells',
  description: 'Access recordings of our past worship services, teachings, and special events.',
}

export const revalidate = 60 // Revalidate every 60 seconds

export default async function PastEventsPage() {
  const pastEvents: SanityPastEvent[] = await client.fetch(pastEventQueries.allPastEvents)

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-purple-700 to-purple-900 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Past Events Library
            </h1>
            <p className="text-xl text-purple-100 max-w-3xl mx-auto">
              Experience powerful moments from our past worship services, teachings, and special events.
              Each recording captures the anointing and presence of God from these gatherings.
            </p>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {pastEvents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No past event recordings are available at this time. Check back soon!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {pastEvents.map((event) => (
                <PastEventCard key={event._id} event={event} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

function PastEventCard({ event }: { event: SanityPastEvent }) {
  const thumbnailUrl = event.thumbnail
    ? urlFor(event.thumbnail).width(600).height(400).url()
    : '/images/placeholder-event.jpg'

  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const categoryLabels: Record<string, string> = {
    worship: 'Worship',
    teaching: 'Teaching',
    prayer: 'Prayer',
    outreach: 'Outreach',
    youth: 'Youth',
    special: 'Special Event',
    conference: 'Conference',
    fellowship: 'Fellowship',
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gray-200">
        <img
          src={thumbnailUrl}
          alt={event.thumbnail?.alt || event.title}
          className="w-full h-full object-cover"
        />
        {event.featured && (
          <div className="absolute top-3 left-3 bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold">
            Featured
          </div>
        )}
        {event.duration && (
          <div className="absolute bottom-3 right-3 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
            {event.duration}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Category Badge */}
        <div className="mb-3">
          <span className="inline-block bg-purple-100 text-purple-800 text-xs font-semibold px-3 py-1 rounded-full">
            {categoryLabels[event.category] || event.category}
          </span>
        </div>

        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Event Date */}
        <p className="text-sm text-gray-500 mb-3">
          {eventDate}
        </p>

        {/* Description */}
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {event.description}
        </p>

        {/* Speakers */}
        {event.speakers && event.speakers.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-1">Featured Speakers:</p>
            <p className="text-sm text-gray-700 font-medium">
              {event.speakers.join(', ')}
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
          </div>
          <Link
            href={`/past-events/${event.slug.current}`}
            className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors text-sm font-semibold"
          >
            Learn More
          </Link>
        </div>
      </div>
    </div>
  )
}
