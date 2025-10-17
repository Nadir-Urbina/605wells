'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import Header from '@/components/Header';
import KingdomBuilderForm from '@/components/KingdomBuilderForm';
import { client, eventQueries, urlFor, type SanityEvent, type EventSession } from '@/lib/sanity';

export default function EventsPage() {
  const [events, setEvents] = useState<SanityEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<SanityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDonateFormOpen, setIsDonateFormOpen] = useState(false);

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'worship', label: 'Worship Services' },
    { value: 'teaching', label: 'Teaching & Discipleship' },
    { value: 'prayer', label: 'Prayer & Intercession' },
    { value: 'outreach', label: 'Community Outreach' },
    { value: 'youth', label: 'Youth Ministry' },
    { value: 'special', label: 'Special Events' },
    { value: 'conference', label: 'Conferences' },
    { value: 'fellowship', label: 'Fellowship' },
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await client.fetch(eventQueries.upcomingEvents);
        setEvents(allEvents);
        setFilteredEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let filtered = events;

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(event => event.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEvents(filtered);
  }, [events, selectedCategory, searchTerm]);

  const formatEventSchedule = (eventSchedule: EventSession[]) => {
    if (!eventSchedule || eventSchedule.length === 0) {
      return { month: 'TBD', day: '', timeDisplay: 'TBD', fullDate: 'Date TBD' };
    }

    const firstSession = eventSchedule[0];
    const startDate = new Date(firstSession.startTime);
    const endDate = new Date(firstSession.endTime);
    
    const month = startDate.toLocaleDateString('en-US', { month: 'short' });
    const day = startDate.getDate();
    const fullDate = startDate.toLocaleDateString('en-US', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    
    if (eventSchedule.length === 1) {
      // Single session
      const timeDisplay = `${startDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })} - ${endDate.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      })}`;
      return { month, day, timeDisplay, fullDate };
    } else {
      // Multi-session event
      const lastSession = eventSchedule[eventSchedule.length - 1];
      const lastStartDate = new Date(lastSession.startTime);
      const dateRange = `${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${lastStartDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
      const timeDisplay = `${eventSchedule.length} sessions`;
      return { month, day, timeDisplay, fullDate: dateRange };
    }
  };

  const formatPrice = (event: SanityEvent) => {
    const isHybrid = event.registrationType === 'hybrid';
    const inPersonPrice = event.price;
    const onlinePrice = event.onlinePrice;

    if (isHybrid && inPersonPrice !== undefined && onlinePrice !== undefined) {
      // Both prices exist for hybrid event
      if (inPersonPrice === 0 && onlinePrice === 0) return 'Free';
      if (inPersonPrice === 0) return `Free / $${onlinePrice}`;
      if (onlinePrice === 0) return `$${inPersonPrice} / Free`;
      return `$${inPersonPrice} / $${onlinePrice}`;
    }

    // Non-hybrid or only one price
    if (!inPersonPrice || inPersonPrice === 0) return 'Free';
    return `$${inPersonPrice}`;
  };

  const getCategoryLabel = (value: string) => {
    return categories.find(cat => cat.value === value)?.label || value;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header onDonateClick={() => setIsDonateFormOpen(true)} />
      
      <div className="pt-20 pb-16">
        {/* Hero Section */}
        <section className="py-16 sm:py-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6 font-montserrat">
                Kingdom Events
              </h1>
              <p className="text-lg sm:text-xl text-gray-700 max-w-3xl mx-auto mb-8">
                Join us for transformational gatherings that heal, build, and send out Kingdom leaders.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Filters and Search */}
        <section className="px-4 sm:px-6 lg:px-8 mb-12">
          <div className="max-w-6xl mx-auto">
            <motion.div
              className="bg-white rounded-xl shadow-lg p-6 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Search */}
                <div className="flex-1">
                  <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
                    Search Events
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="search"
                      placeholder="Search by title or description..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    />
                    <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>

                {/* Category Filter */}
                <div className="lg:w-80">
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Category
                  </label>
                  <select
                    id="category"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    {categories.map((category) => (
                      <option key={category.value} value={category.value}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-gray-600">
                {loading ? 'Loading events...' : `${filteredEvents.length} event${filteredEvents.length !== 1 ? 's' : ''} found`}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Events Grid */}
        <section className="px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="animate-pulse">
                    <div className="bg-gray-300 h-48 rounded-t-xl"></div>
                    <div className="bg-white p-6 rounded-b-xl">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-4"></div>
                      <div className="h-20 bg-gray-300 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEvents.length === 0 ? (
              <motion.div
                className="text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6 }}
              >
                <svg className="w-24 h-24 text-gray-300 mx-auto mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No events found</h3>
                <p className="text-gray-500">
                  {searchTerm || selectedCategory !== 'all' 
                    ? 'Try adjusting your search or filter criteria.'
                    : 'Check back soon for upcoming events and gatherings.'
                  }
                </p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredEvents.map((event, index) => {
                  const { month, day, timeDisplay, fullDate } = formatEventSchedule(event.eventSchedule);
                  
                  return (
                    <motion.div
                      key={event._id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 group"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      whileHover={{ y: -5 }}
                    >
                      {/* Event Image */}
                      <div className="relative h-48 overflow-hidden">
                        {event.featuredImage ? (
                          <Image
                            src={urlFor(event.featuredImage).width(400).height(200).url()}
                            alt={event.featuredImage.alt || event.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
                            <svg className="w-16 h-16 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                        
                        {/* Date Badge */}
                        <div className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 text-center shadow-lg">
                          <div className="text-xs font-semibold text-purple-600 uppercase">{month}</div>
                          <div className="text-lg font-bold text-gray-900">{day}</div>
                        </div>

                        {/* Price Badge */}
                        {event.registrationType === 'hybrid' && event.price !== undefined && event.onlinePrice !== undefined ? (
                          <div className="absolute top-4 right-4 flex flex-col gap-1">
                            <div className="bg-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold text-center">
                              In-Person: {event.price === 0 ? 'Free' : `$${event.price}`}
                            </div>
                            <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-xs font-semibold text-center">
                              Online: {event.onlinePrice === 0 ? 'Free' : `$${event.onlinePrice}`}
                            </div>
                          </div>
                        ) : (
                          <div className="absolute top-4 right-4 bg-purple-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                            {formatPrice(event)}
                          </div>
                        )}

                        {/* Category Badge */}
                        {event.category && (
                          <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
                            {getCategoryLabel(event.category)}
                          </div>
                        )}
                      </div>

                      {/* Event Content */}
                      <div className="p-6">
                                                 <div className="flex items-center gap-2 mb-3">
                           <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                           </svg>
                           <span className="text-sm text-gray-600">{timeDisplay}</span>
                         </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors duration-300">
                          {event.title}
                        </h3>

                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                          {fullDate}
                        </p>

                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {event.description}
                        </p>

                        {event.location?.name && (
                          <div className="flex items-center gap-2 mb-4">
                            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-sm text-gray-600 line-clamp-1">{event.location.name}</span>
                          </div>
                        )}

                        <div className="flex gap-3">
                          <Link
                            href={`/events/${event.slug.current}`}
                            className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-center py-2 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-300"
                          >
                            Learn More
                          </Link>
                          {event.registrationLink && (
                            <a
                              href={event.registrationLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 border-2 border-purple-600 text-purple-600 text-center py-2 px-4 rounded-lg font-semibold hover:bg-purple-600 hover:text-white transition-all duration-300"
                            >
                              Register
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </div>

      <KingdomBuilderForm
        isOpen={isDonateFormOpen}
        onClose={() => setIsDonateFormOpen(false)}
        onPaymentSuccess={() => setIsDonateFormOpen(false)}
      />
    </div>
  );
} 