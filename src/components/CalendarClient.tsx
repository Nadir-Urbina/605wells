'use client';

import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import enUS from 'date-fns/locale/en-US';
import { useMemo, useState } from 'react';

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

interface CalendarClientProps {
  events: CalendarEvent[];
  onSelectEvent: (event: CalendarEvent) => void;
  defaultView?: 'month' | 'week' | 'day' | 'agenda';
}

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 0 }),
  getDay,
  locales,
});

export default function CalendarClient({ events, onSelectEvent, defaultView = 'month' }: CalendarClientProps) {
  const [currentView, setCurrentView] = useState<'month' | 'week' | 'day' | 'agenda'>(defaultView);
  const [currentDate, setCurrentDate] = useState(new Date());

  const categoryColors = useMemo(() => ({
    worship: '#8b5cf6',
    teaching: '#3b82f6',
    prayer: '#10b981',
    outreach: '#f59e0b',
    youth: '#ef4444',
    special: '#06b6d4',
    conference: '#a855f7',
    fellowship: '#22c55e',
    default: '#4b5563',
  }), []);

  const eventPropGetter = (event: CalendarEvent) => {
    const category = event.resource?.category as keyof typeof categoryColors | undefined;
    const color = (category && categoryColors[category]) || categoryColors.default;
    return {
      style: {
        backgroundColor: color,
        borderColor: color,
        color: 'white',
      },
      title: `${event.resource?.eventTitle || event.title}${event.resource?.sessionTitle ? ' • ' + event.resource.sessionTitle : ''}`,
    };
  };

  return (
    <Calendar
      localizer={localizer}
      events={events}
      startAccessor="start"
      endAccessor="end"
      views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
      view={currentView}
      date={currentDate}
      onView={(view) => setCurrentView(view as 'month' | 'week' | 'day' | 'agenda')}
      onNavigate={(date) => setCurrentDate(date)}
      popup
      onSelectEvent={onSelectEvent}
      eventPropGetter={eventPropGetter}
    />
  );
}


