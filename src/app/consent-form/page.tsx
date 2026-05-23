'use client'

import { useRef, useState, useEffect } from 'react'
import SignaturePad, { SignaturePadHandle } from '@/components/SignaturePad'

function formatDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function SuccessScreen({ name }: { name: string }) {
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          window.location.href = '/'
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full p-10 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Form Submitted</h1>
        <p className="text-gray-600">
          Thank you, <strong>{name}</strong>.
        </p>
        <p className="text-sm text-gray-400 mt-6">
          Redirecting you home in {countdown} second{countdown !== 1 ? 's' : ''}…
        </p>
      </div>
    </div>
  )
}

export default function ConsentFormPage() {
  const sigRef = useRef<SignaturePadHandle>(null)
  const [hasSigned, setHasSigned] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    releasorName: '',
    releasorEmail: '',
    releasorPhone: '',
    dateOfAgreement: (() => {
      const d = new Date()
      const yyyy = d.getFullYear()
      const mm = String(d.getMonth() + 1).padStart(2, '0')
      const dd = String(d.getDate()).padStart(2, '0')
      return `${yyyy}-${mm}-${dd}`
    })(),
    section2Initial: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleClearSignature = () => {
    sigRef.current?.clear()
    setHasSigned(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.releasorName.trim()) {
      setError('Please enter your full name at the top of the form.')
      return
    }
    if (!form.releasorEmail.trim()) {
      setError('Please enter your email address.')
      return
    }
    if (!form.section2Initial.trim()) {
      setError('Please provide your initials for Section 2 (Confidentiality).')
      return
    }
    if (sigRef.current?.isEmpty()) {
      setError('Please draw your signature before submitting.')
      return
    }

    const signatureDataUrl = sigRef.current?.getDataURL()
    if (!signatureDataUrl) {
      setError('Could not capture signature. Please try again.')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/consent-form/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, signatureDataUrl }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Submission failed. Please try again.')
        return
      }
      setSubmitted(true)
    } catch {
      setError('An unexpected error occurred. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return <SuccessScreen name={form.releasorName} />
  }

  const displayName = form.releasorName.trim() || null
  const displayDate = form.dateOfAgreement ? formatDate(form.dateOfAgreement) : null

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">

        {/* Page title */}
        <div className="text-center mb-8">
          <p className="text-xs uppercase tracking-widest text-gray-400 mb-2">East Gate Kingdom Fellowship</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Adult General Release Agreement and Waiver of Claims
          </h1>
          <p className="text-sm text-gray-500 mt-2">
            Between the Prayer Team of East Gate Kingdom Fellowship and the Person Receiving Inner Healing / Deliverance
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Step 1: Identify yourself ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <p className="text-xs uppercase tracking-widest text-gray-400 mb-4">Step 1 of 3 — Your Information</p>
            <p className="text-sm text-gray-600 mb-5">
              Please fill in your name and the date before reading the agreement below.
              These will appear in the document exactly as you type them.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="releasorName"
                  value={form.releasorName}
                  onChange={handleChange}
                  placeholder="As it appears on your ID"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date of Agreement <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="dateOfAgreement"
                  value={form.dateOfAgreement}
                  onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  required
                />
              </div>
            </div>
          </div>

          {/* ── Step 2: Agreement text ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-gray-800 text-sm leading-loose space-y-6">
            <p className="text-xs uppercase tracking-widest text-gray-400">Step 2 of 3 — Read & Initial</p>

            {/* Opening paragraph with live name + date */}
            <p>
              This General Release Agreement and Waiver of Claims is made and entered into this day of{' '}
              {displayDate ? (
                <strong className="text-gray-900">{displayDate}</strong>
              ) : (
                <span className="italic text-gray-400">(date)</span>
              )}{' '}
              by the East Gate Kingdom Fellowship prayer team and{' '}
              {displayName ? (
                <strong className="text-gray-900 underline decoration-dotted underline-offset-4">{displayName}</strong>
              ) : (
                <span className="italic text-gray-400">(your name)</span>
              )}{' '}
              (Releasor).
            </p>

            <p>
              <strong>WHEREAS,</strong> Releasor desires to have East Gate Kingdom Fellowship prayer team minister to
              Releasor with a spiritual evaluation, inner spiritual healing, and/or deliverance/exorcism (hereafter known
              as &quot;the procedure&quot;) whereby they shall attempt to free or deliver the Releasor from any evil spirits or
              demons or any unwelcome and uninvited presence; and
            </p>

            <p>
              <strong>WHEREAS,</strong> Releasor acknowledges certain risks associated with this procedure including
              mental, physical, emotional and spiritual hazards; and
            </p>

            <p>
              <strong>WHEREAS,</strong> Releasor acknowledges that during this time the Prayer Team may have to
              physically restrain Releasor to protect both Releasor and the Prayer Team,
            </p>

            <p>
              <strong>WHEREAS,</strong> Releasor is over the age of eighteen and mentally competent,
            </p>

            <p>
              <strong>NOW, THEREFORE,</strong> in consideration of the mutual covenants contained herein, which each of
              the parties acknowledge as adequate and sufficient, the parties hereto agree as follows:
            </p>

            <p>
              <strong>1.</strong> The Prayer Team agrees to perform a spiritual evaluation, inner spiritual healing,
              and/or deliverance/exorcism (&quot;the procedure&quot;) on Releasor. Releasor acknowledges that the Prayer Team
              makes no claims as to the results of the procedure due to the many and variable emotional, circumstantial,
              and spiritual factors involved. Releasor acknowledges that the Prayer Team are not licensed counselors,
              that they minister by the Christian bible, and that they may or may not be ordained and/or full time
              ministers.
            </p>

            {/* Section 2 — with inline initial field */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <p className="font-semibold text-gray-900">2. Confidentiality</p>
              <p>
                The Prayer Team is committed to keep confidential whatever the Releasor shares. We, East Gate Kingdom
                Fellowship, are, however, required by law to report to the appropriate persons two kinds of things:
              </p>
              <ol className="list-[lower-alpha] ml-6 space-y-1">
                <li>
                  Any intent of a person to take harmful, dangerous, or criminal action against another person or
                  against himself/herself, or
                </li>
                <li>Any act of child or elder abuse.</li>
              </ol>

              {/* Inline initial field */}
              <div className="pt-3 border-t border-amber-200 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-amber-800 font-medium">
                    Initial here to acknowledge you have read and understood the confidentiality terms above.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <input
                    type="text"
                    name="section2Initial"
                    value={form.section2Initial}
                    onChange={handleChange}
                    placeholder="Initials"
                    maxLength={5}
                    className="w-24 border-2 border-amber-400 rounded-lg px-2 py-2 text-center text-lg uppercase tracking-widest font-bold text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    required
                  />
                  <span className="text-xs text-amber-700">Your initials</span>
                </div>
              </div>
            </div>

            <p>
              <strong>3.</strong> Releasor, for himself, herself, his/her heirs, personal representatives, successors
              and assigns hereby irrevocably waives, releases, discharges, indemnifies and agrees to hold harmless East
              Gate Kingdom Fellowship, East Gate Jacksonville, and its officers, directors, employees, subsidiaries,
              affiliates, affiliated entities, agents, successors and assigns from and against any and all actions,
              causes of action, suits, claims, damages, demands and liabilities of whatever nature, at law or in equity,
              now or hereafter existing, for any reason whatsoever, having to do in any way with the procedure,
              including without limitation, attorneys&apos; fees and costs incurred by East Gate, in the defense of such
              actions.
            </p>

            <p>
              Releasor, for himself, herself, his/her heirs, personal representatives, successors and assigns hereby
              irrevocably waives, releases, discharges, indemnifies and agrees to hold harmless East Gate, its officers,
              directors, employees, subsidiaries, affiliates, affiliated entities, agents, successors and assigns from
              and against any and all actions, causes of action, suits, claims, damages, demands and liabilities of
              whatever nature, at law or in equity, now or hereafter existing, for any reason whatsoever, including,
              without limitation, personal injury, death and loss or damage to property arising out of or resulting from
              the exorcism, and including without limitation, attorneys&apos; fees and costs incurred by East Gate in the
              defense of such actions.
            </p>

            <p>
              <strong>5.</strong> Releasor acknowledges that East Gate Kingdom Fellowship by performing the procedure,
              desires to free those in bondage to Satan. Any gifts provided by Releasor to East Gate shall be used to
              spiritually assist other persons and to further East Gate Kingdom Fellowship&apos;s outreach.
            </p>

            <p>
              <strong>6.</strong> The terms and provisions of this Agreement shall be binding upon the parties and their
              heirs, successors and assigns and shall be governed by FL laws without regard to conflict of law
              principles.
            </p>

            <p>
              <strong>7.</strong> Unless certain exceptions are so stated in writing, East Gate Kingdom Fellowship and
              Releasor agree that neither party shall divulge, disclose, publicize or, in any manner, make reference to
              this Agreement, the terms of this Agreement, the fact that any claims were made, or any of the specific
              allegations of the claims, except as may be necessary to effectuate the terms of this Agreement.
              Notwithstanding the above, a party to this agreement may disclose the terms of this agreement, or the
              circumstances or events leading up to this agreement, if required to do so by law.
            </p>

            <p>
              <strong>8.</strong> Any controversy arising from this agreement will be conclusively determined by
              arbitration in Jacksonville, FL, in accordance with the Rules of the American Arbitration Association.
              The Arbitrator&apos;s decision must be delivered in writing accompanied by written findings of fact and
              conclusions of law. The prevailing party shall be awarded his, her or its costs and reasonable
              attorneys&apos; fees.
            </p>

            <p>
              <strong>9.</strong> The Releasing Party acknowledges that he/she is signing this agreement freely and
              voluntarily, with full knowledge and understanding of all of its terms.
            </p>

            <p>
              <strong>10.</strong> This agreement constitutes the entire understanding between the parties and
              supersedes any and all prior or contemporaneous discussions or agreements. This agreement, including this
              paragraph, may be amended or modified only by a written instrument signed by both of the parties or their
              authorized representatives. If any court rules that any provision of this agreement is invalid or
              unenforceable, that ruling shall not affect the validity or enforcing of any other provision of this
              agreement.
            </p>

            <p className="font-semibold border-t border-gray-200 pt-5">
              IN WITNESS WHEREOF, the parties have executed this agreement as of{' '}
              {displayDate ? (
                <span className="text-gray-900">{displayDate}</span>
              ) : (
                <span className="italic text-gray-400">(date)</span>
              )}
              , the date first written above.
            </p>
          </div>

          {/* ── Step 3: Contact info + signature ── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 space-y-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-gray-400 mb-1">Step 3 of 3 — Sign</p>
              <p className="text-sm text-gray-600">
                Provide your contact information and draw your signature to complete the agreement.
              </p>
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="releasorEmail"
                  value={form.releasorEmail}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  type="tel"
                  name="releasorPhone"
                  value={form.releasorPhone}
                  onChange={handleChange}
                  placeholder="(904) 555-0100"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-800"
                />
              </div>
            </div>

            {/* Signature recap line */}
            <div className="bg-gray-50 rounded-xl border border-gray-200 px-5 py-4 text-sm text-gray-700 space-y-1">
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Releasor Name:</span>
                <span className={displayName ? 'font-semibold text-gray-900' : 'italic text-gray-400'}>
                  {displayName || '(not yet entered)'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Date:</span>
                <span className={displayDate ? 'font-semibold text-gray-900' : 'italic text-gray-400'}>
                  {displayDate || '(not yet entered)'}
                </span>
              </div>
              <div className="flex gap-2">
                <span className="text-gray-500 w-32 shrink-0">Section 2 Initial:</span>
                <span className={form.section2Initial.trim() ? 'font-bold tracking-widest text-gray-900' : 'italic text-gray-400'}>
                  {form.section2Initial.trim().toUpperCase() || '(not yet entered)'}
                </span>
              </div>
            </div>

            {/* Signature pad */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Releasor Signature <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleClearSignature}
                  className="text-xs text-gray-400 hover:text-red-500 underline transition-colors"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Draw your signature below using your mouse or finger.
              </p>
              <div
                className={`rounded-xl border-2 transition-colors overflow-hidden ${
                  hasSigned ? 'border-green-400 bg-white' : 'border-dashed border-gray-300 bg-gray-50'
                }`}
              >
                <SignaturePad ref={sigRef} height={180} onSign={() => setHasSigned(true)} />
              </div>
              {hasSigned && (
                <p className="text-xs text-green-600 mt-1.5 flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Signature captured
                </p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Disclosure */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-3 text-xs text-blue-700">
              By submitting you confirm that you have read, understand, and freely agree to all terms of this General
              Release Agreement and Waiver of Claims. Your digital signature, name, IP address, and timestamp will be
              recorded as legal evidence of your consent.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 hover:bg-gray-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-colors text-sm tracking-wide"
            >
              {isSubmitting ? 'Submitting…' : 'I Agree — Submit Signed Form'}
            </button>
          </div>

        </form>

        <p className="text-center text-xs text-gray-400 mt-6 mb-2">
          East Gate Kingdom Fellowship · 605 Wells Road, Orange Park, FL
        </p>
      </div>
    </div>
  )
}
