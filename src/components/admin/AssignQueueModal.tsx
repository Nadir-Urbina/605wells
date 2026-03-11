'use client';

import { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { formatDateEST, getNextWeek } from '@/lib/calendar';

interface QueueEntry {
  id: string;
  ministryType: string;
  ministryTypeTitle: string;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  preferredDays?: string[];
  preferredTimes?: string[];
  requestMessage?: string;
}

interface TeamMember {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

interface TimeSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  bookingId?: string;
}

interface AssignQueueModalProps {
  queueEntry: QueueEntry;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignQueueModal({
  queueEntry,
  onClose,
  onSuccess,
}: AssignQueueModalProps) {
  const [step, setStep] = useState(1); // 1: Select team member, 2: Select slot
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [selectedTeamMember, setSelectedTeamMember] = useState<string | null>(null);
  const [availability, setAvailability] = useState<Record<string, TimeSlot[]>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [weekDays, setWeekDays] = useState<Date[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  useEffect(() => {
    if (selectedTeamMember) {
      const days = getNextWeek();
      setWeekDays(days);
      fetchAvailability(selectedTeamMember, days);
    }
  }, [selectedTeamMember]);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/team-members');
      if (response.ok) {
        const data = await response.json();
        // Filter to only volunteers for free queue
        const volunteers = data.teamMembers.filter(
          (member: TeamMember) => member.role === 'volunteer'
        );
        setTeamMembers(volunteers);
      }
    } catch (error) {
      console.error('Error fetching team members:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailability = async (teamMemberId: string, days: Date[]) => {
    setIsLoading(true);
    try {
      const startDate = formatDateEST(days[0]);
      const endDate = formatDateEST(days[days.length - 1]);

      const response = await fetch(
        `/api/virtual-hub/availability?teamMemberId=${teamMemberId}&startDate=${startDate}&endDate=${endDate}`
      );

      if (response.ok) {
        const data = await response.json();
        setAvailability(data.availability || {});
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability({});
    } finally {
      setIsLoading(false);
    }
  };

  const handleTeamMemberSelect = (memberId: string) => {
    setSelectedTeamMember(memberId);
    setStep(2);
  };

  const handleSlotSelect = (date: string, slot: TimeSlot) => {
    if (slot.available && !slot.bookingId) {
      setSelectedDate(date);
      setSelectedSlot(slot);
    }
  };

  const handleAssign = async () => {
    if (!selectedTeamMember || !selectedDate || !selectedSlot) {
      setError('Please select a team member and time slot');
      return;
    }

    setIsAssigning(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/queue/assign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queueEntryId: queueEntry.id,
          teamMemberId: selectedTeamMember,
          scheduledDate: selectedDate,
          scheduledTime: selectedSlot.startTime,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to assign queue entry');
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Error assigning queue entry:', err);
      setError(err instanceof Error ? err.message : 'Failed to assign queue entry');
    } finally {
      setIsAssigning(false);
    }
  };

  const getAvailableSlotCount = (date: Date): number => {
    const dateStr = formatDateEST(date);
    const slots = availability[dateStr] || [];
    return slots.filter((slot) => slot.available && !slot.bookingId).length;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-6 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Assign to Team Member Slot</h2>
              <p className="text-sm text-gray-600 mt-1">
                {queueEntry.attendeeInfo.firstName} {queueEntry.attendeeInfo.lastName} - {queueEntry.ministryTypeTitle}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Team Member */}
          {step === 1 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Volunteer</h3>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : teamMembers.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-600">No volunteers available for this ministry type.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teamMembers.map((member) => (
                    <button
                      key={member._id}
                      onClick={() => handleTeamMemberSelect(member._id)}
                      className="p-4 border-2 border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all text-left"
                    >
                      <div className="font-semibold text-gray-900">
                        {member.firstName} {member.lastName}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{member.email}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Time Slot */}
          {step === 2 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Select Time Slot</h3>
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  ← Change Team Member
                </button>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Date Selection */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Date</h4>
                    <div className="space-y-2">
                      {weekDays.map((day) => {
                        const dateStr = formatDateEST(day);
                        const availableCount = getAvailableSlotCount(day);
                        const isSelected = selectedDate === dateStr;

                        return (
                          <button
                            key={dateStr}
                            onClick={() => setSelectedDate(isSelected ? null : dateStr)}
                            disabled={availableCount === 0}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                              isSelected
                                ? 'border-purple-600 bg-purple-50'
                                : availableCount > 0
                                ? 'border-gray-300 hover:border-purple-400'
                                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-gray-900">
                                  {format(day, 'EEEE, MMM d')}
                                </div>
                                {availableCount > 0 && (
                                  <div className="text-sm text-gray-600 mt-1">
                                    {availableCount} slot{availableCount !== 1 ? 's' : ''} available
                                  </div>
                                )}
                              </div>
                              {isSelected && (
                                <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Time Slot Selection */}
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">
                      {selectedDate ? `Available Times for ${format(new Date(selectedDate), 'MMM d')}` : 'Select a Date'}
                    </h4>
                    {selectedDate && availability[selectedDate] ? (
                      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                        {availability[selectedDate]
                          .filter((slot) => slot.available && !slot.bookingId)
                          .map((slot, index) => {
                            const isSelected = selectedSlot?.startTime === slot.startTime;
                            return (
                              <button
                                key={index}
                                onClick={() => handleSlotSelect(selectedDate, slot)}
                                className={`px-3 py-2 rounded-lg border-2 font-medium transition-all ${
                                  isSelected
                                    ? 'border-purple-600 bg-purple-600 text-white'
                                    : 'border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white'
                                }`}
                              >
                                {slot.startTime}
                              </button>
                            );
                          })}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-gray-500">
                        {selectedDate ? 'No available slots for this date' : 'Please select a date first'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {step === 2 && (
            <button
              onClick={handleAssign}
              disabled={!selectedSlot || isAssigning}
              className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              {isAssigning ? 'Assigning...' : 'Assign to Slot'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
