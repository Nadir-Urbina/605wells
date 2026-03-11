'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

interface BookingDetails {
  ministryTypeTitle: string;
  teamMemberName: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  attendeeInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  payment: {
    amount: number;
    stripePaymentIntentId: string;
  };
  videoMeeting?: {
    provider: 'daily' | 'zoom';
    joinUrl: string;
  };
}

function ConfirmationPage() {
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');
  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!bookingId) {
      setError('No booking ID provided');
      setIsLoading(false);
      return;
    }

    // Fetch booking details with polling (retry up to 10 times with 2-second delays)
    const fetchBooking = async (retryCount = 0, maxRetries = 10) => {
      try {
        const response = await fetch(`/api/virtual-hub/booking/${bookingId}`);

        if (!response.ok) {
          // If booking not found and we have retries left, wait and try again
          if (response.status === 404 && retryCount < maxRetries) {
            console.log(`Booking not found, retrying in 2 seconds... (${retryCount + 1}/${maxRetries})`);
            setTimeout(() => fetchBooking(retryCount + 1, maxRetries), 2000);
            return;
          }
          throw new Error('Failed to fetch booking details');
        }

        const data = await response.json();
        setBooking(data.booking);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching booking:', err);
        setError('Unable to load booking details. Please check your email for confirmation.');
        setIsLoading(false);
      }
    };

    fetchBooking();
  }, [bookingId]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Unable to Load Booking</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/virtual-hub"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Return to Virtual Hub
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Booking Confirmed!
          </h1>
          <p className="text-lg text-gray-600">
            Your ministry session has been successfully scheduled.
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Session Details</h2>

          <div className="space-y-4">
            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Ministry Type:</span>
              <span className="text-gray-900 font-semibold text-right">{booking.ministryTypeTitle}</span>
            </div>

            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Team Member:</span>
              <span className="text-gray-900 font-semibold text-right">{booking.teamMemberName}</span>
            </div>

            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Date & Time:</span>
              <span className="text-gray-900 font-semibold text-right">
                {new Date(booking.scheduledDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                <br />
                {booking.scheduledTime} EST
              </span>
            </div>

            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Duration:</span>
              <span className="text-gray-900 font-semibold text-right">{booking.duration} minutes</span>
            </div>

            <div className="flex justify-between items-start py-3 border-b border-gray-200">
              <span className="text-gray-600 font-medium">Attendee:</span>
              <span className="text-gray-900 font-semibold text-right">
                {booking.attendeeInfo.firstName} {booking.attendeeInfo.lastName}
                <br />
                <span className="text-sm text-gray-600">{booking.attendeeInfo.email}</span>
              </span>
            </div>

            <div className="flex justify-between items-start py-3">
              <span className="text-gray-600 font-medium">Amount Paid:</span>
              <span className="text-2xl font-bold text-purple-600">${booking.payment.amount.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Video Meeting Link Card */}
        {booking.videoMeeting && (
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 md:p-8 mb-6">
            <div className="flex items-start">
              <svg className="w-8 h-8 text-blue-600 mr-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-blue-900 mb-2">Your Video Meeting Link</h3>
                <p className="text-blue-800 mb-4">
                  Join your session at the scheduled time using this link. Save it for easy access!
                </p>
                <a
                  href={booking.videoMeeting.joinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Join Video Meeting
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                <p className="text-sm text-blue-700 mt-3">
                  💡 No app required! Works in any web browser on your computer, tablet, or phone.
                </p>
                <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
                  <p className="text-xs text-blue-900 flex items-start">
                    <svg className="w-4 h-4 mr-2 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <span><strong>Recording Notice:</strong> This session will be automatically recorded for quality assurance and accountability purposes. The recording will be securely stored and accessible only to you and your team member.</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Next Steps Card */}
        <div className="bg-purple-50 rounded-xl border-2 border-purple-200 p-6 md:p-8 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">What Happens Next?</h2>
          <div className="space-y-3">
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                1
              </div>
              <p className="text-gray-700">
                <strong>Confirmation Email:</strong> You&apos;ll receive a confirmation email at{' '}
                <span className="text-purple-600">{booking.attendeeInfo.email}</span> with all the details{booking.videoMeeting && ' including your video meeting link'}.
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                2
              </div>
              <p className="text-gray-700">
                <strong>Intake Form:</strong> Please complete the intake form to help your team member prepare for your session.
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                3
              </div>
              <p className="text-gray-700">
                <strong>Join Your Session:</strong> {booking.videoMeeting ? 'Use the video meeting link above to join at your scheduled time.' : 'You&apos;ll receive a video meeting link via email before your scheduled session.'}
              </p>
            </div>
            <div className="flex items-start">
              <div className="flex-shrink-0 w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3 mt-0.5">
                4
              </div>
              <p className="text-gray-700">
                <strong>Prepare:</strong> Take time to reflect and prepare any questions you&apos;d like to discuss during your session.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href={`/virtual-hub/intake/${bookingId}`}
            className="flex-1 bg-purple-600 text-white px-6 py-4 rounded-lg font-semibold text-center hover:bg-purple-700 transition-colors"
          >
            Complete Intake Form
          </Link>
          <Link
            href="/virtual-hub"
            className="flex-1 bg-white text-purple-600 px-6 py-4 rounded-lg font-semibold text-center border-2 border-purple-600 hover:bg-purple-50 transition-colors"
          >
            Return to Virtual Hub
          </Link>
        </div>

        {/* Support Note */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600">
            Need to reschedule or have questions?{' '}
            <a href="mailto:support@605wells.com" className="text-purple-600 hover:underline font-medium">
              Contact us
            </a>
          </p>
          <p className="text-xs text-gray-500 mt-2">
            Booking ID: {bookingId}
          </p>
        </div>
      </div>
    </div>
  );
}

function ConfirmationPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    }>
      <ConfirmationPage />
    </Suspense>
  );
}

export default ConfirmationPageWrapper;
