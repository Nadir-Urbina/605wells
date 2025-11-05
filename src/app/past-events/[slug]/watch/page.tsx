'use client'

import { useEffect, useState, use } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface AttendeeInfo {
  attendeeName: string
  attendeeEmail: string
  accessType: 'purchased' | 'complimentary' | 'admin'
  pastEvent: {
    title: string
    slug: string
    vimeoEmbedCode: string
    eventDate: string
    duration?: string
    speakers?: string[]
  }
  accessInfo: {
    accessCount: number
    firstAccess: boolean
  }
}

export default function WatchPastEventPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params)
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [isValidating, setIsValidating] = useState(true)
  const [attendeeInfo, setAttendeeInfo] = useState<AttendeeInfo | null>(null)
  const [error, setError] = useState<string | null>(null)

  const validateAccess = async () => {
    try {
      const response = await fetch('/api/past-events/validate-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          pastEventSlug: resolvedParams.slug,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Access denied')
      }

      if (data.valid) {
        setAttendeeInfo(data)
      } else {
        throw new Error('Invalid access token')
      }
    } catch (err: unknown) {
      console.error('Validation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to validate access')
    } finally {
      setIsValidating(false)
    }
  }

  useEffect(() => {
    if (!token) {
      setError('No access token provided. Please check your email for the access link.')
      setIsValidating(false)
      return
    }

    validateAccess()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, resolvedParams.slug])

  // Loading state
  if (isValidating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Validating your access...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !attendeeInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
              <svg
                className="h-8 w-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <div className="space-y-3">
              <Link
                href="/past-events"
                className="block w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 transition-colors font-semibold"
              >
                Browse Past Events
              </Link>
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
    )
  }

  // Success state - show video player
  const eventDate = new Date(attendeeInfo.pastEvent.eventDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const accessTypeLabels = {
    purchased: 'Purchased Access',
    complimentary: 'Complimentary Access',
    admin: 'Admin Access',
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link href="/past-events" className="text-purple-600 hover:text-purple-700 font-semibold">
              ← Back to Past Events
            </Link>
            <div className="text-sm text-gray-600">
              Welcome, {attendeeInfo.attendeeName.split(' ')[0]}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Banner */}
        {attendeeInfo.accessInfo.firstAccess && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg className="w-6 h-6 text-green-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-green-900 font-semibold mb-1">Welcome! Your access is active</h3>
                <p className="text-green-700 text-sm">
                  You now have unlimited access to this recording. Bookmark this page or save the link from your email to watch anytime.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Event Info */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {attendeeInfo.pastEvent.title}
          </h1>
          <div className="flex flex-wrap items-center gap-4 text-gray-600">
            <span>{eventDate}</span>
            {attendeeInfo.pastEvent.duration && (
              <>
                <span>•</span>
                <span>{attendeeInfo.pastEvent.duration}</span>
              </>
            )}
            <span>•</span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
              {accessTypeLabels[attendeeInfo.accessType]}
            </span>
          </div>

          {/* Speakers */}
          {attendeeInfo.pastEvent.speakers && attendeeInfo.pastEvent.speakers.length > 0 && (
            <div className="mt-4">
              <span className="text-sm text-gray-600">Featured Speakers: </span>
              <span className="text-sm text-gray-900 font-medium">
                {attendeeInfo.pastEvent.speakers.join(', ')}
              </span>
            </div>
          )}
        </div>

        {/* Video Player */}
        <div className="bg-black rounded-lg overflow-hidden shadow-lg mb-6">
          {attendeeInfo.pastEvent.vimeoEmbedCode ? (
            <div className="relative aspect-video w-full">
              <div
                className="absolute inset-0"
                dangerouslySetInnerHTML={{
                  __html: attendeeInfo.pastEvent.vimeoEmbedCode
                    .replace(/width="[^"]*"/gi, 'width="100%"')
                    .replace(/height="[^"]*"/gi, 'height="100%"')
                    .replace(/<iframe/gi, '<iframe style="position:absolute;top:0;left:0;width:100%;height:100%"'),
                }}
              />
            </div>
          ) : (
            <div className="relative aspect-video flex items-center justify-center">
              <div className="text-center text-white p-8">
                <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                </svg>
                <p className="text-lg">Video player not configured</p>
                <p className="text-sm opacity-75 mt-2">Please contact support</p>
              </div>
            </div>
          )}
        </div>

        {/* Access Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <h3 className="text-blue-900 font-semibold mb-2">Your Access Details</h3>
              <ul className="text-blue-700 text-sm space-y-1">
                <li>• You have watched this {attendeeInfo.accessInfo.accessCount} {attendeeInfo.accessInfo.accessCount === 1 ? 'time' : 'times'}</li>
                <li>• Unlimited views - watch as many times as you&apos;d like</li>
                <li>• Save this link to access the recording anytime</li>
                <li>• Registered email: {attendeeInfo.attendeeEmail}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
