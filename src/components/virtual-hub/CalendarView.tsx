'use client';

import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths, isToday, isBefore, startOfDay } from 'date-fns';
import { formatDisplayDate, formatDateEST } from '@/lib/calendar';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

interface CalendarViewProps {
  teamMemberId: string;
  ministryTypeId: string;
  duration: number;
  onSlotSelect: (date: string, timeSlot: TimeSlot) => void;
}

export default function CalendarView({
  teamMemberId,
  ministryTypeId,
  duration,
  onSlotSelect,
}: CalendarViewProps) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthDays, setMonthDays] = useState<Date[]>([]);

  useEffect(() => {
    // Get all days in current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    setMonthDays(days);

    // Fetch availability for all days
    fetchAvailability(days);
  }, [teamMemberId, currentMonth]);

  const fetchAvailability = async (days: Date[]) => {
    setIsLoading(true);

    try {
      const startDate = formatDateEST(days[0]);
      const endDate = formatDateEST(days[days.length - 1]);

      const response = await fetch(
        `/api/virtual-hub/availability?teamMemberId=${teamMemberId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch availability');
      }

      const data = await response.json();
      setAvailability(data.availability || {});
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateSelect = (date: Date) => {
    const dateStr = formatDateEST(date);
    setSelectedDate(selectedDate === dateStr ? null : dateStr);
  };

  const handleSlotSelect = (timeSlot: TimeSlot) => {
    if (selectedDate && timeSlot.available) {
      onSlotSelect(selectedDate, timeSlot);
    }
  };

  const getAvailableSlotCount = (date: Date): number => {
    const dateStr = formatDateEST(date);
    const slots = availability[dateStr] || [];
    return slots.filter((slot) => slot.available).length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Select a Date & Time</h2>
      <p className="text-gray-600 mb-6">
        All times shown in Eastern Time (EST/EDT). Choose a date, then select an available time slot.
      </p>

      {/* Date Selection */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">{format(currentMonth, 'MMMM yyyy')}</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Previous month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
              aria-label="Next month"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <div key={day} className="text-center text-xs font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}

          {/* Calendar days */}
          {monthDays.map((day) => {
            const dateStr = formatDateEST(day);
            const availableCount = getAvailableSlotCount(day);
            const isSelected = selectedDate === dateStr;
            const isPast = isBefore(day, startOfDay(new Date()));
            const todayClass = isToday(day) ? 'ring-2 ring-purple-400' : '';

            return (
              <button
                key={dateStr}
                onClick={() => handleDateSelect(day)}
                disabled={availableCount === 0 || isPast}
                className={`aspect-square p-2 rounded-lg border-2 transition-all duration-200 ${todayClass} ${
                  isSelected
                    ? 'border-purple-600 bg-purple-50'
                    : availableCount > 0 && !isPast
                    ? 'border-gray-300 hover:border-purple-400 hover:bg-gray-50'
                    : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                }`}
              >
                <div
                  className={`text-sm font-bold ${
                    isSelected ? 'text-purple-600' : isPast ? 'text-gray-400' : 'text-gray-900'
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {availableCount > 0 && !isPast && (
                  <div className="text-xs text-green-600 font-medium">
                    {availableCount}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slot Selection */}
      {selectedDate && (
        <div>
          <h3 className="text-sm font-semibold text-gray-700 mb-3">
            Available Times for {formatDisplayDate(selectedDate)}
          </h3>

          {availability[selectedDate] && availability[selectedDate].length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {availability[selectedDate].map((slot, index) => (
                <button
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  disabled={!slot.available}
                  className={`px-4 py-3 rounded-lg border-2 font-medium transition-all duration-200 ${
                    slot.available
                      ? 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                      : 'border-gray-200 text-gray-400 bg-gray-50 cursor-not-allowed'
                  }`}
                >
                  {slot.startTime}
                </button>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No available time slots for this date.</p>
            </div>
          )}
        </div>
      )}

      {/* No Availability Message */}
      {!isLoading && monthDays.every((day) => getAvailableSlotCount(day) === 0 || isBefore(day, startOfDay(new Date()))) && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No Availability This Month
          </h3>
          <p className="text-gray-600 mb-4">
            This team member doesn&apos;t have any available slots in {format(currentMonth, 'MMMM')}.
          </p>
          <p className="text-sm text-gray-500">
            Please try selecting a different team member or join the free queue.
          </p>
        </div>
      )}
    </div>
  );
}
