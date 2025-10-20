'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import AdminGuard from '@/components/AdminGuard'
import * as XLSX from 'xlsx'

interface EventDetails {
  _id: string
  title: string
  slug: { current: string }
  price?: number
  eventSchedule: Array<{ startTime: string; endTime: string }>
  location?: { name?: string; address?: string }
  registrationType?: string
  registrationLimit?: number
  registrationClosed?: boolean
}

interface Registration {
  _id: string
  attendee: {
    firstName: string
    lastName: string
    email: string
    phone?: string
  }
  customer?: {
    firstName?: string
    lastName?: string
    email?: string
    phone?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
  }
  payment?: {
    stripePaymentIntentId: string
    amount: number
    originalPrice?: number
    discountApplied?: boolean
    discountAmount?: number
    status: string
  }
  attendanceType?: 'in-person' | 'online'
  registrationDate: string
  status: string
  emailsSent?: Array<{
    type: string
    sentAt: string
    subject?: string
  }>
  notes?: string
}

interface EventStats {
  totalRegistrations: number
  confirmedRegistrations: number
  cancelledRegistrations: number
  checkedInRegistrations: number
  noShowRegistrations: number
  totalRevenue: number
  averageTicketPrice: number
  registrationsByStatus: Record<string, number>
  registrationsByDay: Record<string, number>
}

interface EventData {
  event: EventDetails
  registrations: Registration[]
  stats: EventStats
}

function EventRegistrationsContent() {
  const params = useParams()
  const eventId = params.eventId as string
  
  const [data, setData] = useState<EventData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRegistration, setEditingRegistration] = useState<string | null>(null)
  const [editStatus, setEditStatus] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [attendanceFilter, setAttendanceFilter] = useState<'all' | 'in-person' | 'online'>('all')

  const fetchEventData = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/events/${eventId}/registrations`)
      if (!response.ok) {
        throw new Error('Failed to fetch event data')
      }
      const eventData = await response.json()
      setData(eventData)
    } catch (error) {
      console.error('Error fetching event data:', error)
      setError('Failed to load event data')
    } finally {
      setIsLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    if (eventId) {
      fetchEventData()
    }
  }, [eventId, fetchEventData])

  const handleEditRegistration = (registration: Registration) => {
    setEditingRegistration(registration._id)
    setEditStatus(registration.status)
    setEditNotes(registration.notes || '')
  }

  const handleSaveRegistration = async (registrationId: string) => {
    try {
      const response = await fetch(`/api/admin/registrations/${registrationId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: editStatus,
          notes: editNotes,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update registration')
      }

      // Refresh data
      await fetchEventData()
      setEditingRegistration(null)
    } catch (error) {
      console.error('Error updating registration:', error)
      alert('Failed to update registration')
    }
  }

  const handleCancelEdit = () => {
    setEditingRegistration(null)
    setEditStatus('')
    setEditNotes('')
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      case 'checked-in':
        return 'bg-blue-100 text-blue-800'
      case 'no-show':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getAttendanceTypeBadgeColor = (type?: string) => {
    switch (type) {
      case 'in-person':
        return 'bg-purple-100 text-purple-800'
      case 'online':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter registrations by attendance type
  const filteredRegistrations = data?.registrations.filter(reg => {
    if (attendanceFilter === 'all') return true
    return reg.attendanceType === attendanceFilter
  }) || []

  // Calculate stats for filtered registrations
  const inPersonCount = data?.registrations.filter(r => r.attendanceType === 'in-person').length || 0
  const onlineCount = data?.registrations.filter(r => r.attendanceType === 'online').length || 0
  const isHybridEvent = data?.event.registrationType === 'hybrid'

  const exportToCSV = () => {
    if (!data) return

    const exportData = filteredRegistrations.map(reg => ({
      'First Name': reg.attendee.firstName,
      'Last Name': reg.attendee.lastName,
      'Email': reg.attendee.email,
      'Phone': reg.attendee.phone || '',
      'Attendance Type': reg.attendanceType ? (reg.attendanceType === 'in-person' ? 'In-Person' : 'Online') : '',
      'Registration Date': formatDate(reg.registrationDate),
      'Amount Paid': reg.payment?.amount ? formatCurrency(reg.payment.amount) : 'Free',
      'Discount Applied': reg.payment?.discountApplied ? 'Yes' : 'No',
      'Discount Amount': reg.payment?.discountAmount ? formatCurrency(reg.payment.discountAmount) : '',
      'Original Price': reg.payment?.originalPrice ? formatCurrency(reg.payment.originalPrice) : '',
      'Status': reg.status,
      'Notes': reg.notes || '',
      'Customer First Name': reg.customer?.firstName || '',
      'Customer Last Name': reg.customer?.lastName || '',
      'Customer Email': reg.customer?.email || '',
      'Customer Phone': reg.customer?.phone || '',
      'Customer Address': reg.customer?.address || '',
      'Customer City': reg.customer?.city || '',
      'Customer State': reg.customer?.state || '',
      'Customer Zip': reg.customer?.zipCode || '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

    const fileName = `${data.event.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${attendanceFilter}.csv`
    XLSX.writeFile(wb, fileName, { bookType: 'csv' })
  }

  const exportToXLSX = () => {
    if (!data) return

    const exportData = filteredRegistrations.map(reg => ({
      'First Name': reg.attendee.firstName,
      'Last Name': reg.attendee.lastName,
      'Email': reg.attendee.email,
      'Phone': reg.attendee.phone || '',
      'Attendance Type': reg.attendanceType ? (reg.attendanceType === 'in-person' ? 'In-Person' : 'Online') : '',
      'Registration Date': formatDate(reg.registrationDate),
      'Amount Paid': reg.payment?.amount || 0,
      'Discount Applied': reg.payment?.discountApplied ? 'Yes' : 'No',
      'Discount Amount': reg.payment?.discountAmount || 0,
      'Original Price': reg.payment?.originalPrice || 0,
      'Status': reg.status,
      'Notes': reg.notes || '',
      'Customer First Name': reg.customer?.firstName || '',
      'Customer Last Name': reg.customer?.lastName || '',
      'Customer Email': reg.customer?.email || '',
      'Customer Phone': reg.customer?.phone || '',
      'Customer Address': reg.customer?.address || '',
      'Customer City': reg.customer?.city || '',
      'Customer State': reg.customer?.state || '',
      'Customer Zip': reg.customer?.zipCode || '',
    }))

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Registrations')

    const fileName = `${data.event.title.replace(/[^a-z0-9]/gi, '_')}_registrations_${attendanceFilter}.xlsx`
    XLSX.writeFile(wb, fileName)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-700">{error || 'Event not found'}</p>
          <Link
            href="/admin/dashboard"
            className="mt-2 inline-block text-sm text-red-600 hover:text-red-500"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <Link
                href="/admin/dashboard"
                className="text-sm text-gray-600 hover:text-gray-500 mb-2 inline-block"
              >
                ← Back to Dashboard
              </Link>
              <h1 className="text-3xl font-bold text-gray-900">
                {data.event.title}
              </h1>
              <p className="text-sm text-gray-600">
                Event Registrations
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Event Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Event Date</h3>
              <p className="text-lg text-gray-900">
                {data.event.eventSchedule?.[0]?.startTime
                  ? formatDate(data.event.eventSchedule[0].startTime)
                  : 'TBD'
                }
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Location</h3>
              <p className="text-lg text-gray-900">
                {data.event.location?.name || 'TBD'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-600">Price</h3>
              <p className="text-lg text-gray-900">
                {data.event.price ? formatCurrency(data.event.price) : 'Free'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-semibold text-gray-900">{data.stats.totalRegistrations}</div>
            <div className="text-sm text-gray-600">Total Registrations</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-semibold text-green-600">{data.stats.confirmedRegistrations}</div>
            <div className="text-sm text-gray-600">Confirmed</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-semibold text-blue-600">{data.stats.checkedInRegistrations}</div>
            <div className="text-sm text-gray-600">Checked In</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-2xl font-semibold text-gray-900">{formatCurrency(data.stats.totalRevenue)}</div>
            <div className="text-sm text-gray-600">Total Revenue</div>
          </div>
        </div>

        {/* Hybrid Event Stats */}
        {isHybridEvent && (inPersonCount > 0 || onlineCount > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-semibold text-purple-600">{inPersonCount}</div>
              <div className="text-sm text-gray-600">In-Person Registrations</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-2xl font-semibold text-blue-600">{onlineCount}</div>
              <div className="text-sm text-gray-600">Online Registrations</div>
            </div>
          </div>
        )}

        {/* Registrations Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <h2 className="text-lg font-medium text-gray-900">Registrations</h2>

              <div className="flex items-center gap-4 flex-wrap">
                {/* Export Buttons */}
                {filteredRegistrations.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Export:</span>
                    <button
                      onClick={exportToCSV}
                      className="px-3 py-1 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      onClick={exportToXLSX}
                      className="px-3 py-1 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                    >
                      XLSX
                    </button>
                  </div>
                )}

                {/* Attendance Type Filter for Hybrid Events */}
                {isHybridEvent && (inPersonCount > 0 || onlineCount > 0) && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Filter by:</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAttendanceFilter('all')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          attendanceFilter === 'all'
                            ? 'bg-orange-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        All ({data.stats.totalRegistrations})
                      </button>
                      <button
                        onClick={() => setAttendanceFilter('in-person')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          attendanceFilter === 'in-person'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        In-Person ({inPersonCount})
                      </button>
                      <button
                        onClick={() => setAttendanceFilter('online')}
                        className={`px-3 py-1 text-sm rounded-md ${
                          attendanceFilter === 'online'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                      >
                        Online ({onlineCount})
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {filteredRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendee
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    {isHybridEvent && (
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Type
                      </th>
                    )}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Registration Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredRegistrations.map((registration) => (
                    <tr key={registration._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {registration.attendee.firstName} {registration.attendee.lastName}
                          </div>
                          {registration.notes && (
                            <div className="text-sm text-gray-500">
                              Note: {registration.notes}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{registration.attendee.email}</div>
                        {registration.attendee.phone && (
                          <div className="text-sm text-gray-500">{registration.attendee.phone}</div>
                        )}
                      </td>
                      {isHybridEvent && (
                        <td className="px-6 py-4 whitespace-nowrap">
                          {registration.attendanceType ? (
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getAttendanceTypeBadgeColor(registration.attendanceType)}`}>
                              {registration.attendanceType === 'in-person' ? 'In-Person' : 'Online'}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">—</span>
                          )}
                        </td>
                      )}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(registration.registrationDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {registration.payment?.amount ? formatCurrency(registration.payment.amount) : 'Free'}
                        {registration.payment?.discountApplied && (
                          <div className="text-xs text-green-600">
                            (Discount applied)
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingRegistration === registration._id ? (
                          <select
                            value={editStatus}
                            onChange={(e) => setEditStatus(e.target.value)}
                            className="text-sm rounded-md border-gray-300 focus:border-orange-500 focus:ring-orange-500"
                          >
                            <option value="confirmed">Confirmed</option>
                            <option value="cancelled">Cancelled</option>
                            <option value="checked-in">Checked In</option>
                            <option value="no-show">No Show</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(registration.status)}`}>
                            {registration.status}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {editingRegistration === registration._id ? (
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveRegistration(registration._id)}
                              className="text-green-600 hover:text-green-900"
                            >
                              Save
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleEditRegistration(registration)}
                            className="text-orange-600 hover:text-orange-900"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Edit Notes Form */}
              {editingRegistration && (
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes
                  </label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full border-gray-300 rounded-md focus:border-orange-500 focus:ring-orange-500"
                    placeholder="Add notes about this registration..."
                  />
                </div>
              )}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <p className="text-gray-500">
                {attendanceFilter !== 'all'
                  ? `No ${attendanceFilter} registrations found`
                  : 'No registrations yet'
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function EventRegistrationsPage() {
  return (
    <AdminGuard>
      <EventRegistrationsContent />
    </AdminGuard>
  )
}
