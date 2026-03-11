'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import IntakeFormRenderer from '@/components/virtual-hub/IntakeFormRenderer';

interface IntakeQuestion {
  question: string;
  type: 'text' | 'textarea' | 'select' | 'multiselect';
  required: boolean;
  options?: string[];
  placeholder?: string;
}

interface BookingData {
  ministryType: string;
  ministryTypeTitle: string;
  attendeeInfo: {
    firstName: string;
  };
  intakeForm?: {
    submittedAt: string;
  };
}

export default function IntakeFormPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.bookingId as string;

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [questions, setQuestions] = useState<IntakeQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch booking details
        const bookingResponse = await fetch(`/api/virtual-hub/booking/${bookingId}`);
        if (!bookingResponse.ok) {
          throw new Error('Failed to fetch booking details');
        }
        const bookingData = await bookingResponse.json();
        setBooking(bookingData.booking);

        // Check if intake form already submitted
        if (bookingData.booking.intakeForm?.submittedAt) {
          setSubmitted(true);
          setIsLoading(false);
          return;
        }

        // Fetch ministry type to get intake questions
        const ministryResponse = await fetch(
          `/api/virtual-hub/ministry-type/${bookingData.booking.ministryType}`
        );
        if (!ministryResponse.ok) {
          throw new Error('Failed to fetch ministry type');
        }
        const ministryData = await ministryResponse.json();
        setQuestions(ministryData.intakeFormQuestions || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load intake form');
      } finally {
        setIsLoading(false);
      }
    };

    if (bookingId) {
      fetchData();
    }
  }, [bookingId]);

  const handleSuccess = () => {
    setSubmitted(true);
    // Optionally redirect after a delay
    setTimeout(() => {
      router.push('/virtual-hub');
    }, 3000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Form</h1>
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

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Intake Form Submitted!</h1>
          <p className="text-gray-600 mb-6">
            Thank you for completing the intake form. Your team member will review your responses before your session.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Redirecting you back to the Virtual Hub...
          </p>
          <Link
            href="/virtual-hub"
            className="inline-block bg-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-purple-700 transition-colors"
          >
            Return to Virtual Hub Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-white py-12 px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/virtual-hub"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 mb-4"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Virtual Hub
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Intake Form</h1>
          <p className="text-lg text-gray-600">
            {booking && `Welcome, ${booking.attendeeInfo.firstName}! `}
            Please complete this form to help us prepare for your {booking?.ministryTypeTitle || 'ministry'} session.
          </p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="font-semibold text-blue-900 mb-1">Why do we ask these questions?</h3>
              <p className="text-sm text-blue-800">
                Your responses help our team member understand your needs and prepare specifically for your session,
                ensuring you receive the most effective ministry possible.
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
          <IntakeFormRenderer
            questions={questions}
            bookingId={bookingId}
            onSuccess={handleSuccess}
          />
        </div>

        {/* Privacy Note */}
        <p className="text-xs text-gray-500 text-center mt-6">
          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          Your information is kept confidential and will only be shared with your assigned team member.
        </p>
      </div>
    </div>
  );
}
