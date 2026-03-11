'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import TeamMemberGuard from '@/components/team/TeamMemberGuard';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { firestore } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { formatDateEST, generateTimeSlots } from '@/lib/calendar';

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

interface DayAvailability {
  date: string;
  timeSlots: TimeSlot[];
}

function AvailabilityContent() {
  const { sanityTeamMemberId } = useTeamMember();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate default time slots (30-min intervals from 9 AM to 5 PM)
  const defaultSlots: TimeSlot[] = generateTimeSlots(30).map((time) => ({
    startTime: time,
    endTime: '', // Will be calculated
    available: false,
  }));

  useEffect(() => {
    fetchAvailability();
  }, [currentMonth, sanityTeamMemberId]);

  const fetchAvailability = async () => {
    if (!sanityTeamMemberId) return;

    setIsLoading(true);
    try {
      const start = formatDateEST(startOfMonth(currentMonth));
      const end = formatDateEST(endOfMonth(currentMonth));

      // Fetch from Firestore directly
      const availabilityRef = collection(firestore, 'availability');
      const q = query(
        availabilityRef,
        where('teamMemberId', '==', sanityTeamMemberId),
        where('date', '>=', start),
        where('date', '<=', end)
      );

      const snapshot = await getDocs(q);
      const availabilityData: Record<string, TimeSlot[]> = {};

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        availabilityData[data.date] = data.timeSlots;
      });

      setAvailability(availabilityData);
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
    const dateStr = formatDateEST(date);
    const slots = availability[dateStr] || defaultSlots;
    setSelectedSlots(slots);
  };

  const toggleSlot = (index: number) => {
    const updatedSlots = [...selectedSlots];
    // Don't allow toggling if slot is already booked
    if (!updatedSlots[index].bookingId) {
      updatedSlots[index] = {
        ...updatedSlots[index],
        available: !updatedSlots[index].available,
      };
      setSelectedSlots(updatedSlots);
    }
  };

  const handleSave = async () => {
    if (!selectedDate || !sanityTeamMemberId) return;

    setSaving(true);
    try {
      const dateStr = formatDateEST(selectedDate);

      // Save directly to Firestore
      const availabilityRef = collection(firestore, 'availability');
      const q = query(
        availabilityRef,
        where('teamMemberId', '==', sanityTeamMemberId),
        where('date', '==', dateStr)
      );

      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Create new availability document
        const newDocRef = doc(availabilityRef);
        await setDoc(newDocRef, {
          teamMemberId: sanityTeamMemberId,
          date: dateStr,
          timeSlots: selectedSlots,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        });
      } else {
        // Update existing document
        const existingDoc = snapshot.docs[0];
        await updateDoc(existingDoc.ref, {
          timeSlots: selectedSlots,
          updatedAt: Timestamp.now(),
        });
      }

      // Update local availability
      setAvailability({
        ...availability,
        [dateStr]: selectedSlots,
      });

      alert('Availability saved successfully!');
    } catch (error) {
      console.error('Error saving availability:', error);
      alert('Failed to save availability. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    const updatedSlots = selectedSlots.map((slot) =>
      slot.bookingId ? slot : { ...slot, available: true }
    );
    setSelectedSlots(updatedSlots);
  };

  const handleClearAll = () => {
    const updatedSlots = selectedSlots.map((slot) =>
      slot.bookingId ? slot : { ...slot, available: false }
    );
    setSelectedSlots(updatedSlots);
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Get available slot count for a date
  const getAvailableCount = (date: Date): number => {
    const dateStr = formatDateEST(date);
    const slots = availability[dateStr] || [];
    return slots.filter((slot) => slot.available && !slot.bookingId).length;
  };

  const getBookedCount = (date: Date): number => {
    const dateStr = formatDateEST(date);
    const slots = availability[dateStr] || [];
    return slots.filter((slot) => slot.bookingId).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center space-x-4">
            <Link href="/team/dashboard" className="text-gray-600 hover:text-gray-900">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <h1 className="text-xl font-bold text-gray-900">Manage Availability</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {format(currentMonth, 'MMMM yyyy')}
                </h2>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                    className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2">
                {/* Day Headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                    {day}
                  </div>
                ))}

                {/* Calendar Days */}
                {calendarDays.map((day) => {
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const availableCount = getAvailableCount(day);
                  const bookedCount = getBookedCount(day);
                  const isPast = day < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <button
                      key={day.toString()}
                      onClick={() => !isPast && handleDateClick(day)}
                      disabled={isPast}
                      className={`aspect-square p-2 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-purple-600 bg-purple-50'
                          : isPast
                          ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-50'
                          : 'border-gray-200 hover:border-purple-400 hover:bg-gray-50'
                      }`}
                    >
                      <div className="text-sm font-semibold text-gray-900">{format(day, 'd')}</div>
                      {!isPast && (
                        <div className="mt-1 space-y-0.5">
                          {availableCount > 0 && (
                            <div className="text-xs text-green-600 font-medium">
                              {availableCount} open
                            </div>
                          )}
                          {bookedCount > 0 && (
                            <div className="text-xs text-blue-600 font-medium">
                              {bookedCount} booked
                            </div>
                          )}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Slots Panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-8">
              {selectedDate ? (
                <>
                  <h3 className="text-lg font-bold text-gray-900 mb-4">
                    {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                  </h3>

                  {/* Quick Actions */}
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={handleSelectAll}
                      className="flex-1 text-sm px-3 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
                    >
                      Select All
                    </button>
                    <button
                      onClick={handleClearAll}
                      className="flex-1 text-sm px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Time Slots */}
                  <div className="space-y-2 max-h-96 overflow-y-auto mb-4">
                    {selectedSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => toggleSlot(index)}
                        disabled={!!slot.bookingId}
                        className={`w-full px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          slot.bookingId
                            ? 'border-blue-300 bg-blue-50 text-blue-700 cursor-not-allowed'
                            : slot.available
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-300 bg-white text-gray-700 hover:border-purple-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{slot.startTime}</span>
                          {slot.bookingId && (
                            <span className="text-xs">Booked</span>
                          )}
                          {!slot.bookingId && slot.available && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Save Button */}
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSaving ? 'Saving...' : 'Save Availability'}
                  </button>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <p className="text-gray-600">Select a date to manage your availability</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AvailabilityPage() {
  return (
    <TeamMemberGuard>
      <AvailabilityContent />
    </TeamMemberGuard>
  );
}
