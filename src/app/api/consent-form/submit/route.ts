import { NextRequest, NextResponse } from 'next/server'
import { writeClient } from '@/lib/sanity'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      releasorName,
      releasorEmail,
      releasorPhone,
      dateOfAgreement,
      section2Initial,
      signatureDataUrl,
    } = body

    if (!releasorName || !releasorEmail || !dateOfAgreement || !section2Initial || !signatureDataUrl) {
      return NextResponse.json(
        { error: 'All required fields must be completed, including signature.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(releasorEmail)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      )
    }

    const ipAddress =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      request.headers.get('x-real-ip') ??
      'unknown'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'

    const doc = await writeClient.create({
      _type: 'consentForm',
      releasorName: releasorName.trim(),
      releasorEmail: releasorEmail.trim().toLowerCase(),
      releasorPhone: releasorPhone?.trim() || undefined,
      dateOfAgreement,
      section2Initial: section2Initial.trim().toUpperCase(),
      signatureDataUrl,
      submissionDate: new Date().toISOString(),
      ipAddress,
      userAgent,
      status: 'new',
    })

    return NextResponse.json({ success: true, id: doc._id })
  } catch (error) {
    console.error('Consent form submission error:', error)
    return NextResponse.json(
      { error: 'Failed to save consent form. Please try again.' },
      { status: 500 }
    )
  }
}
