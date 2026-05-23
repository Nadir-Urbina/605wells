'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import AdminGuard, { useAdminUser } from '@/components/AdminGuard'

interface ConsentForm {
  _id: string
  releasorName: string
  releasorEmail: string
  releasorPhone?: string
  dateOfAgreement: string
  section2Initial: string
  signatureDataUrl: string
  submissionDate: string
  ipAddress?: string
  userAgent?: string
  status: string
  notes?: string
}

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-800',
  reviewed: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
}

function ConsentFormsContent() {
  const [forms, setForms] = useState<ConsentForm[]>([])
  const [total, setTotal] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ConsentForm | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const { user } = useAdminUser()

  useEffect(() => {
    fetchForms()
  }, [])

  const fetchForms = async () => {
    try {
      const res = await fetch('/api/consent-form/list')
      if (!res.ok) throw new Error('Failed to fetch consent forms')
      const data = await res.json()
      setForms(data.forms)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
      setError('Failed to load consent forms.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    window.location.href = '/admin/login'
  }

  const formatDate = (ds: string) =>
    new Date(ds).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  const filtered = forms.filter((f) => {
    const matchStatus = filterStatus === 'all' || f.status === filterStatus
    const q = searchQuery.toLowerCase()
    const matchSearch =
      !q ||
      f.releasorName.toLowerCase().includes(q) ||
      f.releasorEmail.toLowerCase().includes(q)
    return matchStatus && matchSearch
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-md p-4 text-center">
          <p className="text-red-700">{error}</p>
          <button onClick={fetchForms} className="mt-2 text-sm text-red-600 hover:text-red-500">
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-4">
              <Link href="/admin/dashboard" className="text-gray-600 hover:text-gray-900">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Consent Forms</h1>
                <p className="text-sm text-gray-600">Deliverance Ministry — Welcome back, {user?.username}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/consent-form"
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                View Public Form
              </a>
              <button
                onClick={handleLogout}
                className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Forms', value: total, color: 'bg-indigo-500' },
            { label: 'New', value: forms.filter((f) => f.status === 'new').length, color: 'bg-blue-500' },
            { label: 'Reviewed', value: forms.filter((f) => f.status === 'reviewed').length, color: 'bg-green-500' },
            { label: 'Archived', value: forms.filter((f) => f.status === 'archived').length, color: 'bg-gray-400' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg shadow p-6 flex items-center gap-4">
              <div className={`w-10 h-10 ${s.color} rounded-full flex items-center justify-center`}>
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                  <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h4v1a1 1 0 102 0V3a2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-500">{s.label}</p>
                <p className="text-2xl font-semibold text-gray-900">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + filter */}
        <div className="bg-white shadow rounded-lg p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Name or email…"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="reviewed">Reviewed</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Signed Forms ({filtered.length})</h2>
          </div>

          {filtered.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {['Name & Contact', 'Agreement Date', 'Section 2 Initial', 'Submitted', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filtered.map((f) => (
                    <tr key={f._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{f.releasorName}</div>
                        <div className="text-sm text-gray-500">{f.releasorEmail}</div>
                        {f.releasorPhone && <div className="text-sm text-gray-500">{f.releasorPhone}</div>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {f.dateOfAgreement
                          ? new Date(f.dateOfAgreement + 'T00:00:00').toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-bold bg-amber-100 text-amber-800 tracking-widest">
                          {f.section2Initial}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(f.submissionDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[f.status] || 'bg-gray-100 text-gray-800'}`}
                        >
                          {f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => setSelected(f)}
                          className="text-indigo-600 hover:text-indigo-900"
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="mt-4 text-gray-500">No consent forms found</p>
              {(searchQuery || filterStatus !== 'all') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterStatus('all') }}
                  className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="bg-gradient-to-r from-indigo-700 to-purple-700 text-white p-6 rounded-t-2xl flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold">{selected.releasorName}</h2>
                <p className="text-indigo-200 text-sm mt-0.5">Deliverance Ministry Consent Form</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white hover:text-indigo-200 transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Personal info */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Contact Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">Email:</span>
                    <a href={`mailto:${selected.releasorEmail}`} className="text-indigo-600 hover:underline">
                      {selected.releasorEmail}
                    </a>
                  </div>
                  {selected.releasorPhone && (
                    <div className="flex gap-2">
                      <span className="font-medium text-gray-600 w-24">Phone:</span>
                      <a href={`tel:${selected.releasorPhone}`} className="text-indigo-600 hover:underline">
                        {selected.releasorPhone}
                      </a>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">Signed on:</span>
                    <span className="text-gray-800">
                      {selected.dateOfAgreement
                        ? new Date(selected.dateOfAgreement + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                        : '—'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">Submitted:</span>
                    <span className="text-gray-800">{formatDate(selected.submissionDate)}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">Sec. 2 Initial:</span>
                    <span className="font-bold tracking-widest text-amber-700">{selected.section2Initial}</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="font-medium text-gray-600 w-24">Status:</span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[selected.status]}`}>
                      {selected.status.charAt(0).toUpperCase() + selected.status.slice(1)}
                    </span>
                  </div>
                </div>
              </section>

              {/* Signature */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Digital Signature</h3>
                <div className="border-2 border-gray-200 rounded-xl overflow-hidden bg-white">
                  <Image
                    src={selected.signatureDataUrl}
                    alt={`Signature of ${selected.releasorName}`}
                    width={900}
                    height={360}
                    className="w-full h-auto"
                    unoptimized
                  />
                </div>
              </section>

              {/* Technical metadata */}
              <section>
                <h3 className="text-base font-semibold text-gray-900 mb-3">Submission Metadata</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-xs text-gray-600 font-mono">
                  <div><span className="font-semibold">IP Address:</span> {selected.ipAddress || '—'}</div>
                  <div className="break-all"><span className="font-semibold">User Agent:</span> {selected.userAgent || '—'}</div>
                  <div><span className="font-semibold">Record ID:</span> {selected._id}</div>
                </div>
              </section>

              {selected.notes && (
                <section>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Admin Notes</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-yellow-50 rounded-lg p-4 border border-yellow-100">
                    {selected.notes}
                  </p>
                </section>
              )}

              <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 text-xs text-blue-700">
                To update the status or add notes, open this record in the{' '}
                <a href="/studio" target="_blank" rel="noopener noreferrer" className="underline">
                  Sanity Studio
                </a>
                .
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminConsentForms() {
  return (
    <AdminGuard>
      <ConsentFormsContent />
    </AdminGuard>
  )
}
