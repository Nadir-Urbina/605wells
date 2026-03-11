'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import TeamMemberGuard from '@/components/team/TeamMemberGuard';
import { useTeamMember } from '@/contexts/TeamMemberContext';
import { firestore } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface IntakeResponse {
  question: string;
  answer: unknown;
}

interface Booking {
  id: string;
  ministryTypeTitle: string;
  teamMemberId: string;
  teamMemberName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  status: string;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  payment?: {
    amount: number;
    status: string;
  };
  videoMeeting?: {
    provider: 'daily' | 'zoom';
    roomId: string;
    roomName: string;
    joinUrl: string;
    createdAt: string;
    expiresAt: string | null;
    // Recording information
    recordingEnabled: boolean;
    recordingUrl?: string;
    recordingDownloadUrl?: string;
    recordingStatus?: 'recording' | 'finished' | 'available' | 'failed';
    recordingDuration?: number;
    // Legacy Zoom fields (for backward compatibility)
    meetingId?: string;
    startUrl?: string;
    password?: string;
  };
  intakeForm?: {
    submittedAt: string;
    responses: Record<string, unknown>;
  };
}

function SessionDetailContent() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const { sanityTeamMemberId } = useTeamMember();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      if (!sanityTeamMemberId) return;

      try {
        // Fetch directly from Firestore
        const bookingRef = doc(firestore, 'bookings', sessionId);
        const bookingSnap = await getDoc(bookingRef);

        if (!bookingSnap.exists()) {
          throw new Error('Session not found');
        }

        const bookingData = {
          id: bookingSnap.id,
          ...bookingSnap.data(),
        } as Booking;

        // Verify this booking belongs to the authenticated team member
        if (bookingData.teamMemberId !== sanityTeamMemberId) {
          throw new Error('Unauthorized access to this session');
        }

        setBooking(bookingData);
      } catch (err) {
        console.error('Error fetching session:', err);
        setError(err instanceof Error ? err.message : 'Failed to load session');
      } finally {
        setIsLoading(false);
      }
    };

    if (sessionId && sanityTeamMemberId) {
      fetchSession();
    }
  }, [sessionId, sanityTeamMemberId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Session</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/team/dashboard"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

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
            <h1 className="text-xl font-bold text-gray-900">Session Details</h1>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Status Badge */}
        <div className="mb-6">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
            booking.status === 'scheduled'
              ? 'bg-green-100 text-green-800'
              : booking.status === 'completed'
              ? 'bg-blue-100 text-blue-800'
              : booking.status === 'cancelled'
              ? 'bg-red-100 text-red-800'
              : 'bg-gray-100 text-gray-800'
          }`}>
            {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
          </span>
        </div>

        {/* Session Info Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{booking.ministryTypeTitle}</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Session Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {booking.scheduledTime} EST ({booking.duration} minutes)
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Attendee Information
              </h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-semibold text-gray-900">
                    {booking.attendeeInfo.firstName} {booking.attendeeInfo.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{booking.attendeeInfo.email}</p>
                </div>
                {booking.attendeeInfo.phone && (
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{booking.attendeeInfo.phone}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Video Meeting Card */}
        {booking.videoMeeting && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-2">
                  {booking.videoMeeting.provider === 'daily' ? 'Daily.co Video Meeting' : 'Zoom Meeting Link'}
                </h3>
                <a
                  href={booking.videoMeeting.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {booking.videoMeeting.provider === 'daily' ? 'Join Video Meeting' : 'Start Zoom Meeting'}
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {booking.videoMeeting.password && (
                  <p className="text-sm text-blue-800 mt-2">
                    Meeting Password: <span className="font-mono font-semibold">{booking.videoMeeting.password}</span>
                  </p>
                )}
                <p className="text-xs text-blue-700 mt-2">
                  {booking.videoMeeting.provider === 'daily'
                    ? 'This link will work on any device with a web browser - no app required!'
                    : 'Click to start the meeting as the host'}
                </p>

                {/* Recording Status */}
                {booking.videoMeeting.recordingEnabled && (
                  <div className="mt-4 pt-3 border-t border-blue-200">
                    {booking.videoMeeting.recordingStatus === 'recording' && (
                      <div className="flex items-center text-sm text-blue-800">
                        <div className="flex-shrink-0 w-2 h-2 bg-red-600 rounded-full mr-2 animate-pulse"></div>
                        <span className="font-medium">Session will be automatically recorded</span>
                      </div>
                    )}
                    {booking.videoMeeting.recordingStatus === 'available' && booking.videoMeeting.recordingDownloadUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center text-sm text-green-700 font-medium">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          Recording Available
                          {booking.videoMeeting.recordingDuration && (
                            <span className="ml-2 text-gray-600">
                              ({Math.floor(booking.videoMeeting.recordingDuration / 60)} min)
                            </span>
                          )}
                        </div>
                        <a
                          href={booking.videoMeeting.recordingDownloadUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                          Download Recording
                        </a>
                      </div>
                    )}
                    {booking.videoMeeting.recordingStatus === 'failed' && (
                      <div className="flex items-center text-sm text-red-700">
                        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <span className="font-medium">Recording failed - please contact support</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Intake Form Responses */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Intake Form Responses</h3>

          {booking.intakeForm ? (
            <>
              <div className="mb-6 flex items-center text-sm text-gray-600">
                <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Submitted on{' '}
                {new Date(booking.intakeForm.submittedAt).toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                  hour: 'numeric',
                  minute: '2-digit',
                })}
              </div>

              <div className="space-y-6">
                {Object.entries(booking.intakeForm.responses).map(([question, answer], index) => (
                  <div key={index} className="border-l-4 border-purple-500 pl-4 py-2">
                    <p className="font-semibold text-gray-900 mb-2">{question}</p>
                    <div className="text-gray-700">
                      {Array.isArray(answer) ? (
                        <ul className="list-disc list-inside space-y-1">
                          {answer.map((item, i) => (
                            <li key={i}>{String(item)}</li>
                          ))}
                        </ul>
                      ) : (
                        <p className="whitespace-pre-wrap">{String(answer) || '(No response)'}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Intake Form Not Submitted</h4>
              <p className="text-gray-600">
                The attendee hasn&apos;t completed the intake form yet. They will receive a reminder before the session.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SessionDetailPage() {
  return (
    <TeamMemberGuard>
      <SessionDetailContent />
    </TeamMemberGuard>
  );
}
