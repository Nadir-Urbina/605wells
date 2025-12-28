'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminGuard, { useAdminUser } from '@/components/AdminGuard';

interface MinistryAvailability {
  ministryArea: string;
  daysOfWeek: string[];
  frequency: string;
  timePreferences: string[];
}

interface Volunteer {
  _id: string;
  personalInfo: {
    fullName: string;
    email: string;
    phone: string;
  };
  ministryAvailabilities: MinistryAvailability[];
  submissionDate: string;
  status: string;
  notes?: string;
}

interface VolunteersData {
  volunteers: Volunteer[];
  total: number;
}

const MINISTRY_AREA_LABELS: Record<string, string> = {
  'cleaning': 'Cleaning',
  'child-care': 'Child Care',
  'cooking': 'Cooking/Kitchen',
  'prayer-meetings': 'Prayer/Intercession',
  'lawn-care': 'Lawn Care',
  'building-maintenance': 'Building Maintenance',
  'media': 'Media',
  'worship-team': 'Worship Team',
  'deliverance-inner-healing': 'Deliverance & Inner Healing',
  'events-coordination': 'Events Coordination',
  'decoration': 'Decoration',
};

const FREQUENCY_LABELS: Record<string, string> = {
  'weekly': 'Every Week',
  'bi-weekly': 'Every Two Weeks',
  'monthly': 'Once a Month',
  'occasionally': 'Occasionally',
};

const STATUS_COLORS: Record<string, string> = {
  'new': 'bg-blue-100 text-blue-800',
  'contacted': 'bg-yellow-100 text-yellow-800',
  'active': 'bg-green-100 text-green-800',
  'inactive': 'bg-gray-100 text-gray-800',
  'on-hold': 'bg-orange-100 text-orange-800',
};

function AdminVolunteersContent() {
  const [data, setData] = useState<VolunteersData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAdminUser();

  useEffect(() => {
    fetchVolunteers();
  }, []);

  const fetchVolunteers = async () => {
    try {
      const response = await fetch('/api/volunteers/list');
      if (!response.ok) {
        throw new Error('Failed to fetch volunteers');
      }
      const volunteersData = await response.json();
      setData(volunteersData);
    } catch (error) {
      console.error('Error fetching volunteers:', error);
      setError('Failed to load volunteers data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/admin/logout', { method: 'POST' });
      window.location.href = '/admin/login';
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const capitalizeFirst = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
  };

  const filteredVolunteers = data?.volunteers.filter(volunteer => {
    const matchesStatus = filterStatus === 'all' || volunteer.status === filterStatus;
    const matchesSearch = searchQuery === '' ||
      volunteer.personalInfo.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.personalInfo.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      volunteer.ministryAvailabilities.some(ma =>
        MINISTRY_AREA_LABELS[ma.ministryArea]?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    return matchesStatus && matchesSearch;
  }) || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchVolunteers}
            className="mt-2 text-sm text-red-600 hover:text-red-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <div className="flex items-center space-x-4">
                <Link
                  href="/admin/dashboard"
                  className="text-gray-600 hover:text-gray-900"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                </Link>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Volunteer Management
                  </h1>
                  <p className="text-sm text-gray-600">
                    Welcome back, {user?.username}
                  </p>
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Card */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                  </svg>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Volunteers</p>
                <p className="text-2xl font-semibold text-gray-900">{data?.total || 0}</p>
              </div>
            </div>
          </div>

          {['new', 'contacted', 'active', 'inactive'].map((status) => (
            <div key={status} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'new' ? 'bg-blue-500' :
                    status === 'contacted' ? 'bg-yellow-500' :
                    status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                  }`}>
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">{capitalizeFirst(status)}</p>
                  <p className="text-2xl font-semibold text-gray-900">
                    {data?.volunteers.filter(v => v.status === status).length || 0}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Volunteers
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name, email, or ministry area..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Status
              </label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="all">All Statuses</option>
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="on-hold">On Hold</option>
              </select>
            </div>
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Volunteers ({filteredVolunteers.length})
            </h2>
          </div>

          {filteredVolunteers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name & Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ministry Areas
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Availability
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Submitted
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVolunteers.map((volunteer) => (
                    <tr key={volunteer._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {volunteer.personalInfo.fullName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {volunteer.personalInfo.email}
                          </div>
                          <div className="text-sm text-gray-500">
                            {volunteer.personalInfo.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {volunteer.ministryAvailabilities.slice(0, 3).map((ma, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                            >
                              {MINISTRY_AREA_LABELS[ma.ministryArea] || ma.ministryArea}
                            </span>
                          ))}
                          {volunteer.ministryAvailabilities.length > 3 && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              +{volunteer.ministryAvailabilities.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          <div className="font-medium">
                            {volunteer.ministryAvailabilities.length} ministry area{volunteer.ministryAvailabilities.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-gray-500 text-xs">
                            Click to view details
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[volunteer.status] || 'bg-gray-100 text-gray-800'}`}>
                          {capitalizeFirst(volunteer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(volunteer.submissionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelectedVolunteer(volunteer)}
                          className="text-purple-600 hover:text-purple-900"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p className="mt-4 text-gray-500">No volunteers found</p>
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterStatus('all');
                  }}
                  className="mt-2 text-sm text-purple-600 hover:text-purple-500"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Volunteer Details Modal */}
      {selectedVolunteer && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedVolunteer(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 rounded-t-2xl">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">
                    {selectedVolunteer.personalInfo.fullName}
                  </h2>
                  <p className="text-purple-100 mt-1">
                    Volunteer Details
                  </p>
                </div>
                <button
                  onClick={() => setSelectedVolunteer(null)}
                  className="text-white hover:text-purple-200 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-24">Email:</span>
                    <a href={`mailto:${selectedVolunteer.personalInfo.email}`} className="text-purple-600 hover:text-purple-800">
                      {selectedVolunteer.personalInfo.email}
                    </a>
                  </div>
                  <div className="flex items-center text-sm">
                    <span className="font-medium text-gray-700 w-24">Phone:</span>
                    <a href={`tel:${selectedVolunteer.personalInfo.phone}`} className="text-purple-600 hover:text-purple-800">
                      {selectedVolunteer.personalInfo.phone}
                    </a>
                  </div>
                </div>
              </div>

              {/* Ministry Availabilities */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Ministry Areas & Availability</h3>
                <div className="space-y-4">
                  {selectedVolunteer.ministryAvailabilities.map((ma, idx) => (
                    <div key={idx} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-semibold text-gray-900 text-lg">
                          {MINISTRY_AREA_LABELS[ma.ministryArea] || ma.ministryArea}
                        </h4>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          {FREQUENCY_LABELS[ma.frequency]}
                        </span>
                      </div>

                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-700">Days:</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {ma.daysOfWeek.map((day) => (
                              <span
                                key={day}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-800"
                              >
                                {capitalizeFirst(day)}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <span className="text-sm font-medium text-gray-700">Time Preferences:</span>
                          <div className="mt-1 flex flex-wrap gap-1.5">
                            {ma.timePreferences.map((time) => (
                              <span
                                key={time}
                                className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-green-100 text-green-800"
                              >
                                {capitalizeFirst(time)}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status and Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Status & Notes</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="font-medium text-gray-700">Current Status:</span>
                    <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selectedVolunteer.status]}`}>
                      {capitalizeFirst(selectedVolunteer.status)}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Submitted:</span>
                    <span className="ml-2 text-gray-900">
                      {formatDate(selectedVolunteer.submissionDate)}
                    </span>
                  </div>
                  {selectedVolunteer.notes && (
                    <div>
                      <span className="font-medium text-gray-700">Admin Notes:</span>
                      <p className="mt-1 text-gray-900 whitespace-pre-wrap">
                        {selectedVolunteer.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Note */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> To update volunteer status or add notes, please use the Sanity CMS Studio at{' '}
                  <a href="/studio" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-900">
                    /studio
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminVolunteers() {
  return (
    <AdminGuard>
      <AdminVolunteersContent />
    </AdminGuard>
  );
}
