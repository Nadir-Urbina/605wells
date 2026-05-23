import { NextRequest, NextResponse } from 'next/server'
import { client } from '@/lib/sanity'
import { isAdminAuthenticated } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const isAuthenticated = await isAdminAuthenticated(request)
    if (!isAuthenticated) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const forms = await client.fetch(`
      *[_type == "consentForm"] | order(submissionDate desc) {
        _id,
        releasorName,
        releasorEmail,
        releasorPhone,
        dateOfAgreement,
        section2Initial,
        signatureDataUrl,
        submissionDate,
        ipAddress,
        userAgent,
        status,
        notes
      }
    `)

    return NextResponse.json({ forms, total: forms.length })
  } catch (error) {
    console.error('Error fetching consent forms:', error)
    return NextResponse.json(
      { error: 'Failed to fetch consent forms.' },
      { status: 500 }
    )
  }
}
