'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '@/components/Header';
import { client, eventQueries, urlFor, type SanityEvent, type EventSession } from '@/lib/sanity';
import { PortableText } from '@portabletext/react';

export default function EventDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [event, setEvent] = useState<SanityEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const eventData = await client.fetch(eventQueries.eventBySlug, { slug });
        if (eventData) {
          setEvent(eventData);
        } else {
          setError('Event not found');
        }
      } catch (error) {
        console.error('Error fetching event:', error);
        setError('Failed to load event');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchEvent();
    }
  }, [slug]);

  const formatSchedule = (eventSchedule: EventSession[]) => {
    if (!eventSchedule || eventSchedule.length === 0) {
      return { 
        primaryDate: 'Date & Time TBD',
        primaryTime: 'TBD',
        allSessions: [{ 
          date: 'Date TBD', 
          time: 'Time TBD', 
          title: 'Schedule to be announced', 
          notes: 'Please check back later for updated schedule information.' 
        }]
      };
    }

    const firstSession = eventSchedule[0];
    const firstStartDate = new Date(firstSession.startTime);
    const firstEndDate = new Date(firstSession.endTime);
    
    const primaryDate = firstStartDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    let primaryTime = 'Multiple times';
    if (eventSchedule.length === 1) {
      primaryTime = `${firstStartDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })} - ${firstEndDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
    }

    const allSessions = eventSchedule.map(session => {
      const sessionStartDate = new Date(session.startTime);
      const sessionEndDate = new Date(session.endTime);
      
      return {
        date: sessionStartDate.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        time: `${sessionStartDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })} - ${sessionEndDate.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })}`,
        title: session.sessionTitle,
        notes: session.notes,
      };
    });

    return { primaryDate, primaryTime, allSessions };
  };

  const formatPrice = (price?: number) => {
    if (!price || price === 0) return 'Free Event';
    return `$${price}`;
  };

  const getCategoryLabel = (value?: string) => {
    const categories = {
      worship: 'Worship Service',
      teaching: 'Teaching & Discipleship',
      prayer: 'Prayer & Intercession',
      outreach: 'Community Outreach',
      youth: 'Youth Ministry',
      special: 'Special Event',
      conference: 'Conference',
      fellowship: 'Fellowship',
    };
    return value ? categories[value as keyof typeof categories] || value : '';
  };



  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header onDonateClick={() => {}} />
        <div className="pt-20 pb-16">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="animate-pulse">
              <div className="h-64 bg-gray-300 rounded-xl mb-8"></div>
              <div className="h-8 bg-gray-300 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 mb-8"></div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded"></div>
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header onDonateClick={() => {}} />
        <div className="pt-20 pb-16 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Event Not Found</h1>
            <p className="text-gray-600 mb-8">
              {error || 'The event you are looking for does not exist.'}
            </p>
            <Link
              href="/events"
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-6 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
            >
              Back to Events
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { primaryDate, primaryTime, allSessions } = formatSchedule(event.eventSchedule);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header onDonateClick={() => {}} />
      
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          {/* Background Image */}
          {event.featuredImage && (
            <div className="absolute inset-0 z-0">
              <Image
                src={urlFor(event.featuredImage).width(1200).height(600).url()}
                alt={event.featuredImage.alt || event.title}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/70"></div>
            </div>
          )}

          <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              {/* Breadcrumb */}
              <nav className="mb-8">
                <Link
                  href="/events"
                  className="text-white/80 hover:text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors duration-300"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Back to Events
                </Link>
              </nav>

              {/* Category Badge */}
              {event.category && (
                <div className="mb-4">
                  <span className="inline-block bg-purple-600/90 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm">
                    {getCategoryLabel(event.category)}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-white mb-6 font-montserrat">
                {event.title}
              </h1>

              {/* Date and Time */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-white/90 text-lg mb-8">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>{primaryDate}</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{primaryTime}</span>
                </div>
              </div>

              {/* Price */}
              <div className="text-2xl font-bold text-white mb-8">
                {formatPrice(event.price)}
              </div>

              {/* Registration Button */}
              {event.registrationLink && (
                <motion.a
                  href={event.registrationLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-8 rounded-lg text-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 shadow-xl"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Register Now
                  <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </motion.a>
              )}
            </motion.div>
          </div>
        </section>

        {/* Content Section */}
        <section className="py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {/* Main Content */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  {/* Description */}
                  <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About This Event</h2>
                    <p className="text-gray-700 text-lg leading-relaxed">
                      {event.description}
                    </p>
                  </div>

                  {/* Rich Content */}
                  {event.content && Array.isArray(event.content) && event.content.length > 0 && (
                    <div className="bg-white rounded-xl shadow-lg p-8">
                      <h2 className="text-2xl font-bold text-gray-900 mb-6">Event Details</h2>
                      <div className="prose prose-lg max-w-none">
                        {event.content && (
                          <PortableText
                            value={event.content}
                          />
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Sidebar */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                  className="space-y-6"
                >
                  {/* Event Info Card */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Event Information</h3>
                    
                    <div className="space-y-4">
                      {/* Schedule */}
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Schedule</span>
                        </div>
                        <div className="ml-6 space-y-2">
                          {allSessions.map((session, index) => (
                            <div key={index} className="border-l-2 border-purple-200 pl-3">
                              {session.title && (
                                <p className="font-semibold text-gray-900 text-sm">{session.title}</p>
                              )}
                              <p className="text-gray-900 text-sm">{session.date}</p>
                              <p className="text-gray-700 text-sm">{session.time}</p>
                              {session.notes && (
                                <p className="text-gray-600 text-xs mt-1 italic">{session.notes}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Location */}
                      {event.location && (event.location.name || event.location.address) && (
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="font-medium">Location</span>
                          </div>
                          {event.location.name && (
                            <p className="text-gray-900 ml-6">{event.location.name}</p>
                          )}
                          {event.location.address && (
                            <p className="text-gray-700 ml-6 text-sm whitespace-pre-line">
                              {event.location.address}
                            </p>
                          )}
                        </div>
                      )}

                      {/* Price */}
                      <div>
                        <div className="flex items-center gap-2 text-gray-600 mb-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span className="font-medium">Price</span>
                        </div>
                        <p className="text-gray-900 ml-6 font-semibold">{formatPrice(event.price)}</p>
                      </div>

                      {/* Capacity */}
                      {event.capacity && (
                        <div>
                          <div className="flex items-center gap-2 text-gray-600 mb-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span className="font-medium">Capacity</span>
                          </div>
                          <p className="text-gray-900 ml-6">{event.capacity} attendees</p>
                        </div>
                      )}
                    </div>

                    {/* Registration Button (Mobile) */}
                    {event.registrationLink && (
                      <div className="mt-6 pt-6 border-t border-gray-200">
                        <a
                          href={event.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                          Register Now
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                          </svg>
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Share Event */}
                  <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Share Event</h3>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (navigator.share) {
                            navigator.share({
                              title: event.title,
                              text: event.description,
                              url: window.location.href,
                            });
                          } else {
                            navigator.clipboard.writeText(window.location.href);
                            alert('Link copied to clipboard!');
                          }
                        }}
                        className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors duration-300 flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                        </svg>
                        Share
                      </button>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
} 