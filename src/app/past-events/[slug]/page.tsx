import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { client, pastEventQueries, urlFor, SanityPastEvent } from '@/lib/sanity'
import { PortableText } from '@portabletext/react'
import PastEventCheckoutForm from '@/components/PastEventCheckoutForm'
import Header from '@/components/Header'

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event: SanityPastEvent = await client.fetch(pastEventQueries.pastEventBySlug, { slug })

  if (!event) {
    return {
      title: 'Event Not Found | 605 Wells',
    }
  }

  return {
    title: `${event.title} | Past Events | 605 Wells`,
    description: event.description,
  }
}

export const revalidate = 60

export default async function PastEventDetailPage({ params }: Props) {
  const { slug } = await params
  const event: SanityPastEvent = await client.fetch(pastEventQueries.pastEventBySlug, { slug })

  if (!event) {
    notFound()
  }

  const thumbnailUrl = event.thumbnail
    ? urlFor(event.thumbnail).width(1200).height(630).url()
    : '/images/placeholder-event.jpg'

  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const categoryLabels: Record<string, string> = {
    worship: 'Worship Service',
    teaching: 'Teaching & Discipleship',
    prayer: 'Prayer & Intercession',
    outreach: 'Community Outreach',
    youth: 'Youth Ministry',
    special: 'Special Event',
    conference: 'Conference',
    fellowship: 'Fellowship',
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      {/* Hero Image */}
      <div className="relative h-96 bg-gray-900">
        <img
          src={thumbnailUrl}
          alt={event.thumbnail?.alt || event.title}
          className="w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="mb-4">
              <span className="inline-block bg-purple-600 text-white text-sm font-semibold px-4 py-2 rounded-full">
                {categoryLabels[event.category] || event.category}
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {event.title}
            </h1>
            <p className="text-xl text-gray-200">
              {eventDate}
              {event.duration && ` • ${event.duration}`}
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* Left Column - Details */}
          <div className="lg:col-span-2">
            {/* Description */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {event.description}
              </p>

              {/* Full Content */}
              {event.content && event.content.length > 0 && (
                <div className="prose prose-lg max-w-none">
                  <PortableText value={event.content} />
                </div>
              )}
            </div>

            {/* Speakers */}
            {event.speakers && event.speakers.length > 0 && (
              <div className="mb-8 p-6 bg-purple-50 rounded-lg">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Featured Speakers</h2>
                <ul className="space-y-2">
                  {event.speakers.map((speaker, index) => (
                    <li key={index} className="text-gray-700 flex items-center">
                      <svg className="w-5 h-5 text-purple-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {speaker}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-3">Topics Covered</h2>
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Purchase Card */}
          <div className="lg:col-span-1">
            <div className="bg-white border-2 border-gray-200 rounded-lg p-6 sticky top-4">
              <div className="mb-6">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {event.price === 0 ? 'Free' : `$${event.price.toFixed(2)}`}
                </div>
                <p className="text-gray-600 text-sm">
                  Lifetime access to this recording
                </p>
              </div>

              {/* What's Included */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">What&apos;s Included:</h3>
                <ul className="space-y-2">
                  <li className="text-gray-700 flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Full event recording</span>
                  </li>
                  <li className="text-gray-700 flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Unlimited views</span>
                  </li>
                  <li className="text-gray-700 flex items-start">
                    <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Instant access after purchase</span>
                  </li>
                  {event.duration && (
                    <li className="text-gray-700 flex items-start">
                      <svg className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span>{event.duration} of content</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Checkout Form */}
              <PastEventCheckoutForm event={event} />

              {/* Support Info */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                  Secure payment powered by Stripe
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {event.relatedEvents && event.relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">You May Also Like</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {event.relatedEvents.map((relatedEvent) => {
                const relatedThumbnailUrl = relatedEvent.thumbnail
                  ? urlFor(relatedEvent.thumbnail).width(400).height(250).url()
                  : '/images/placeholder-event.jpg'

                return (
                  <Link
                    key={relatedEvent._id}
                    href={`/past-events/${relatedEvent.slug.current}`}
                    className="group"
                  >
                    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300">
                      <div className="relative h-40 bg-gray-200">
                        <img
                          src={relatedThumbnailUrl}
                          alt={relatedEvent.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                          {relatedEvent.title}
                        </h3>
                        <div className="text-lg font-bold text-purple-600">
                          {relatedEvent.price === 0 ? 'Free' : `$${relatedEvent.price.toFixed(2)}`}
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
