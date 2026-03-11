'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminGuard from '@/components/AdminGuard';
import AssignQueueModal from '@/components/admin/AssignQueueModal';

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
  status: 'pending' | 'assigned' | 'completed' | 'cancelled';
  priority: number;
  createdAt: { seconds: number; nanoseconds: number } | string;
}

function QueueManagementContent() {
  const [queueEntries, setQueueEntries] = useState<QueueEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedEntry, setSelectedEntry] = useState<QueueEntry | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    fetchQueueEntries();
  }, []);

  const fetchQueueEntries = async () => {
    try {
      const response = await fetch('/api/admin/queue');
      if (response.ok) {
        const data = await response.json();
        setQueueEntries(data.queueEntries || []);
      }
    } catch (error) {
      console.error('Error fetching queue entries:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignClick = (entry: QueueEntry) => {
    setSelectedEntry(entry);
    setShowAssignModal(true);
  };

  const getTimeAgo = (timestamp: { seconds: number; nanoseconds: number } | string | { toDate?: () => Date }): string => {
    const date = timestamp && typeof timestamp === 'object' && 'toDate' in timestamp && timestamp.toDate ? timestamp.toDate() : new Date(timestamp as string);
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  const pendingEntries = queueEntries.filter((e) => e.status === 'pending');

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/admin" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <h1 className="text-2xl font-bold text-gray-900">Free Queue Management</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                <span className="font-semibold text-purple-600">{pendingEntries.length}</span> pending requests
              </div>
              <button
                onClick={fetchQueueEntries}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Refresh"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : pendingEntries.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Queue is Empty</h3>
            <p className="text-gray-600">There are no pending requests in the free queue at the moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingEntries.map((entry) => (
              <div key={entry.id} className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {entry.attendeeInfo.firstName} {entry.attendeeInfo.lastName}
                        </h3>
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {entry.ministryTypeTitle}
                        </span>
                        <span className="text-sm text-gray-500">{getTimeAgo(entry.createdAt)}</span>
                      </div>

                      {/* Contact Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          {entry.attendeeInfo.email}
                        </div>
                        {entry.attendeeInfo.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            {entry.attendeeInfo.phone}
                          </div>
                        )}
                      </div>

                      {/* Preferences */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        {entry.preferredDays && entry.preferredDays.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Preferred Days
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {entry.preferredDays.map((day) => (
                                <span key={day} className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                                  {day}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                        {entry.preferredTimes && entry.preferredTimes.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                              Preferred Times
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {entry.preferredTimes.map((time) => (
                                <span key={time} className="inline-block px-2 py-1 text-xs bg-green-100 text-green-800 rounded">
                                  {time}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Request Message */}
                      {entry.requestMessage && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                            Request Message
                          </p>
                          <p className="text-sm text-gray-700">{entry.requestMessage}</p>
                        </div>
                      )}
                    </div>

                    {/* Assign Button */}
                    <div className="ml-4">
                      <button
                        onClick={() => handleAssignClick(entry)}
                        className="px-6 py-2 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 transition-colors whitespace-nowrap"
                      >
                        Assign to Slot
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assign Modal */}
      {showAssignModal && selectedEntry && (
        <AssignQueueModal
          queueEntry={selectedEntry}
          onClose={() => {
            setShowAssignModal(false);
            setSelectedEntry(null);
          }}
          onSuccess={() => {
            fetchQueueEntries(); // Refresh the list
          }}
        />
      )}
    </div>
  );
}

export default function QueueManagementPage() {
  return (
    <AdminGuard>
      <QueueManagementContent />
    </AdminGuard>
  );
}
