'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
// Removed unused motion import
import LivestreamChat from '@/components/LivestreamChat';
import Header from '@/components/Header';

interface EventInfo {
  title: string;
  slug: string;
  restreamEmbedCode?: string;
  eventSchedule?: Array<{
    startTime: string;
    endTime: string;
  }>;
}

interface AttendeeInfo {
  attendeeName: string;
  attendeeEmail: string;
  event: EventInfo;
  accessInfo: {
    accessCount: number;
    firstAccess: boolean;
  };
}

export default function LivestreamPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const eventSlug = params.slug as string;
  const token = searchParams.get('token');
  
  const [isValidating, setIsValidating] = useState(true);
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(true);
  const [isEventLive, setIsEventLive] = useState(false);

  const validateToken = useCallback(async () => {
    try {
      const response = await fetch('/api/livestream/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          eventSlug,
        }),
      });

      const result = await response.json();

      if (response.ok && result.valid) {
        setAttendeeInfo({
          attendeeName: result.attendeeName,
          attendeeEmail: result.attendeeEmail,
          event: result.event,
          accessInfo: result.accessInfo,
        });
        
        // Check if event is currently live (simplified check)
        if (result.event.eventSchedule && result.event.eventSchedule.length > 0) {
          const now = new Date();
          const eventStart = new Date(result.event.eventSchedule[0].startTime);
          const eventEnd = new Date(result.event.eventSchedule[0].endTime);
          setIsEventLive(now >= eventStart && now <= eventEnd);
        }
      } else {
        setError(result.error || 'Invalid access token');
      }
    } catch (err) {
      console.error('Token validation error:', err);
      setError('Failed to validate access. Please try again.');
    } finally {
      setIsValidating(false);
    }
  }, [token, eventSlug]);

  useEffect(() => {
    if (!token) {
      setError('Access token is required');
      setIsValidating(false);
      return;
    }

    validateToken();
  }, [token, eventSlug, validateToken]);

  const formatEventTime = () => {
    if (!attendeeInfo?.event.eventSchedule || attendeeInfo.event.eventSchedule.length === 0) {
      return 'Event time TBD';
    }

    const firstSession = attendeeInfo.event.eventSchedule[0];
    const startDate = new Date(firstSession.startTime);
    const endDate = new Date(firstSession.endTime);

    const dateStr = startDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeStr = `${startDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })} - ${endDate.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`;

    return `${dateStr} at ${timeStr}`;
  };

  // Removed unused getDemoEmbedCode function

  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Validating Access...</h2>
          <p className="text-gray-600">Please wait while we verify your livestream access.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header onDonateClick={() => {}} />
        <div className="flex items-center justify-center py-20">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push('/events')}
                  className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
                >
                  View Events
                </button>
                <p className="text-sm text-gray-500">
                  Need help? Contact us at{' '}
                  <a href="mailto:info@605wells.com" className="text-purple-600 hover:underline">
                    info@605wells.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!attendeeInfo) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onDonateClick={() => {}} />
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                Welcome to {attendeeInfo.event.title}
              </h1>
              <p className="text-purple-100">
                Hello, {attendeeInfo.attendeeName} • {formatEventTime()}
              </p>
            </div>
            <div className="mt-4 md:mt-0 flex items-center space-x-4">
              <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
                isEventLive 
                  ? 'bg-green-500 bg-opacity-20 text-green-100' 
                  : 'bg-yellow-500 bg-opacity-20 text-yellow-100'
              }`}>
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  isEventLive ? 'bg-green-400 animate-pulse' : 'bg-yellow-400'
                }`}></div>
                {isEventLive ? 'LIVE NOW' : 'STARTING SOON'}
              </div>
              {attendeeInfo.accessInfo.firstAccess && (
                <div className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm">
                  🎉 First time joining!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Video Player */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="aspect-video bg-gray-900 relative">
                {attendeeInfo.event.restreamEmbedCode ? (
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ 
                      __html: attendeeInfo.event.restreamEmbedCode 
                    }} 
                  />
                ) : (
                  /* Demo Player */
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900">
                    <div className="text-center text-white">
                      <div className="w-24 h-24 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1.5a2.5 2.5 0 005 0H17M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="text-xl font-semibold mb-2">Demo Livestream Player</h3>
                      <p className="text-gray-300 mb-4">
                        This is where your Restream video will appear
                      </p>
                      <div className="bg-purple-600 bg-opacity-20 border border-purple-500 rounded-lg p-4 max-w-md mx-auto">
                        <p className="text-sm text-purple-200">
                          <strong>Setup Instructions:</strong><br/>
                          1. Get your Restream embed code<br/>
                          2. Add it to the event in Sanity CMS<br/>
                          3. Enable livestream for the event
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Video Controls Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setShowChat(!showChat)}
                      className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm hover:bg-opacity-70 transition-opacity lg:hidden"
                    >
                      {showChat ? 'Hide Chat' : 'Show Chat'}
                    </button>
                  </div>
                  <div className="text-white text-sm bg-black bg-opacity-50 px-2 py-1 rounded">
                    {attendeeInfo.accessInfo.accessCount} views
                  </div>
                </div>
              </div>

              {/* Event Info */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-2">
                  {attendeeInfo.event.title}
                </h2>
                <p className="text-gray-600 mb-4">
                  {formatEventTime()}
                </p>
                
                <div className="flex flex-wrap gap-2">
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm">
                    Online Event
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                    Interactive Q&A
                  </span>
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    HD Quality
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Sidebar */}
          <div className={`lg:col-span-1 ${showChat ? 'block' : 'hidden lg:block'}`}>
            <div className="sticky top-6" style={{ height: 'calc(100vh - 200px)' }}>
              <LivestreamChat
                eventSlug={eventSlug}
                attendeeName={attendeeInfo.attendeeName}
                attendeeEmail={attendeeInfo.attendeeEmail}
                isVisible={true}
              />
            </div>
          </div>
        </div>

        {/* Mobile Chat */}
        <div className={`lg:hidden mt-6 ${showChat ? 'block' : 'hidden'}`}>
          <div style={{ height: '400px' }}>
            <LivestreamChat
              eventSlug={eventSlug}
              attendeeName={attendeeInfo.attendeeName}
              attendeeEmail={attendeeInfo.attendeeEmail}
              isVisible={showChat}
            />
          </div>
        </div>
      </div>

      {/* Help Section */}
      <div className="bg-white border-t border-gray-200 py-6">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need Technical Support?
            </h3>
            <p className="text-gray-600 mb-4">
              Having trouble with the livestream or chat? We&apos;re here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <a
                href="mailto:info@605wells.com?subject=Livestream Support - {attendeeInfo.event.title}"
                className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Email Support
              </a>
              <div className="text-sm text-gray-500">
                Response time: Usually within 15 minutes during events
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
