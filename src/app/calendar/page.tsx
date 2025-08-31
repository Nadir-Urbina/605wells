'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import { client, eventQueries, type SanityEvent, type EventSession } from '@/lib/sanity';
import { useRouter } from 'next/navigation';

const CalendarClient = dynamic(() => import('@/components/CalendarClient'), { ssr: false });

type CalendarEvent = {
  title: string;
  start: Date;
  end: Date;
  resource?: {
    slug: string;
    category?: string;
    price?: number;
    locationName?: string;
    eventTitle?: string;
    sessionTitle?: string;
  };
};

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

export default function CalendarPage() {
  const router = useRouter();
  const [events, setEvents] = useState<SanityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const allEvents = await client.fetch(eventQueries.allEvents);
        setEvents(allEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const { calendarEvents, tbdEvents } = useMemo(() => {
    const calEvents: CalendarEvent[] = [];
    const tbd: SanityEvent[] = [];

    for (const ev of events) {
      if (!ev.eventSchedule || ev.eventSchedule.length === 0 || !ev.eventSchedule[0]?.startTime) {
        tbd.push(ev);
        continue;
      }
      for (const session of ev.eventSchedule as EventSession[]) {
        if (!session.startTime || !session.endTime) continue;
        calEvents.push({
          title: ev.title,
          start: new Date(session.startTime),
          end: new Date(session.endTime),
          resource: {
            slug: ev.slug.current,
            category: ev.category,
            price: ev.price,
            locationName: ev.location?.name,
            eventTitle: ev.title,
            sessionTitle: session.sessionTitle,
          },
        });
      }
    }
    return { calendarEvents: calEvents, tbdEvents: tbd };
  }, [events]);

  const filteredCalendarEvents = useMemo(() => {
    return calendarEvents.filter((e) => {
      const matchesCategory = selectedCategory === 'all' || e.resource?.category === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q ||
        e.title.toLowerCase().includes(q) ||
        (e.resource?.sessionTitle?.toLowerCase().includes(q) ?? false);
      return matchesCategory && matchesSearch;
    });
  }, [calendarEvents, selectedCategory, searchTerm]);

  const filteredTbdEvents = useMemo(() => {
    return tbdEvents.filter((ev) => {
      const matchesCategory = selectedCategory === 'all' || ev.category === selectedCategory;
      const q = searchTerm.trim().toLowerCase();
      const matchesSearch = !q ||
        ev.title.toLowerCase().includes(q) ||
        ev.description.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [tbdEvents, selectedCategory, searchTerm]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header onDonateClick={() => {}} />
      <div className="pt-20 pb-16">
        <section className="py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8 text-center">
              <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2 font-montserrat">Event Calendar</h1>
              <p className="text-gray-600">Browse all published events by date. Click an event to view details.</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
              <div className="flex flex-col lg:flex-row gap-4 items-stretch">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <input
                    type="text"
                    placeholder="Search by title or session..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-3 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="lg:w-80">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full py-3 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-2 sm:p-4 overflow-hidden">
              <div className="rbc-tailwind" style={{ height: 700 }}>
                {loading ? (
                  <div className="p-8 text-center text-gray-500">Loading events...</div>
                ) : (
                  <CalendarClient
                    events={filteredCalendarEvents}
                    onSelectEvent={(ev) => {
                      if (ev.resource?.slug) router.push(`/events/${ev.resource.slug}`);
                    }}
                    defaultView="month"
                  />
                )}
              </div>
            </div>

            {filteredTbdEvents.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Date & Time TBD</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredTbdEvents.map((ev) => (
                    <button
                      key={ev._id}
                      onClick={() => router.push(`/events/${ev.slug.current}`)}
                      className="text-left bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition"
                    >
                      <div className="text-purple-700 font-semibold mb-1">{ev.title}</div>
                      <div className="text-gray-600 text-sm line-clamp-2">{ev.description}</div>
                      {ev.location?.name && (
                        <div className="text-gray-500 text-xs mt-2">Location: {ev.location.name}</div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}


