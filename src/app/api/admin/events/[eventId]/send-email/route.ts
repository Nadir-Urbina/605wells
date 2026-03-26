import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { isAdminAuthenticated } from '@/lib/auth'
import { client } from '@/lib/sanity'

const resend = new Resend(process.env.RESEND_API_KEY)

interface Props {
  params: Promise<{ eventId: string }>
}

export async function POST(request: NextRequest, { params }: Props) {
  const isAuthenticated = await isAdminAuthenticated(request)
  if (!isAuthenticated) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { eventId } = await params

  let body: { subject?: string; htmlContent?: string; attendanceTypeFilter?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { subject, htmlContent, attendanceTypeFilter = 'all' } = body

  if (!subject?.trim()) {
    return NextResponse.json({ error: 'Subject is required' }, { status: 400 })
  }
  if (!htmlContent?.trim()) {
    return NextResponse.json({ error: 'Email content is required' }, { status: 400 })
  }

  const event = await client.fetch(
    `*[_type == "event" && _id == $eventId][0] { _id, title }`,
    { eventId }
  )
  if (!event) {
    return NextResponse.json({ error: 'Event not found' }, { status: 404 })
  }

  const filterClause =
    attendanceTypeFilter !== 'all'
      ? `&& attendanceType == $attendanceType`
      : ''

  const registrations: Array<{ attendee: { firstName: string; email: string } }> =
    await client.fetch(
      `*[_type == "eventRegistration" && event._ref == $eventId && status != "cancelled" ${filterClause}] {
        attendee { firstName, email }
      }`,
      { eventId, attendanceType: attendanceTypeFilter }
    )

  if (registrations.length === 0) {
    return NextResponse.json(
      { error: 'No active registrants found for this selection' },
      { status: 400 }
    )
  }

  const emails = registrations.map((reg) => ({
    from: '605 Wells Revival Hub <noreply@605wells.com>',
    to: reg.attendee.email,
    subject: subject.trim(),
    html: buildEmailHtml(event.title, htmlContent, reg.attendee.firstName),
  }))

  let sent = 0
  let failed = 0

  // Resend batch supports up to 100 emails per call
  for (let i = 0; i < emails.length; i += 100) {
    const batch = emails.slice(i, i + 100)
    try {
      await resend.batch.send(batch)
      sent += batch.length
    } catch (err) {
      console.error(`Batch send error (offset ${i}):`, err)
      failed += batch.length
    }
  }

  return NextResponse.json({ sent, failed, total: registrations.length })
}

function buildEmailHtml(eventTitle: string, body: string, firstName: string): string {
  const personalizedBody = body.replace(/\{\{firstName\}\}/gi, firstName)

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${eventTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6; }
    .container { max-width: 600px; margin: 32px auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { background-color: #ea580c; padding: 36px 32px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; color: #ffffff; letter-spacing: -0.3px; }
    .header p { margin: 6px 0 0; font-size: 13px; color: rgba(255,255,255,0.8); }
    .event-banner { background-color: #fff7ed; border-top: 3px solid #fb923c; padding: 12px 32px; font-size: 13px; font-weight: 600; color: #9a3412; text-transform: uppercase; letter-spacing: 0.5px; }
    .content { padding: 32px 32px 24px; color: #374151; font-size: 15px; line-height: 1.75; }
    .content h1, .content h2, .content h3 { color: #111827; margin-top: 24px; margin-bottom: 8px; }
    .content p { margin: 0 0 16px; }
    .content a { color: #ea580c; text-decoration: underline; }
    .content ul, .content ol { padding-left: 24px; margin: 0 0 16px; }
    .content li { margin: 6px 0; }
    .content strong { font-weight: 600; color: #111827; }
    .divider { height: 1px; background-color: #e5e7eb; margin: 0 32px; }
    .footer { background-color: #111827; padding: 28px 32px; text-align: center; }
    .footer p { margin: 4px 0; font-size: 12px; color: rgba(255,255,255,0.55); }
    .footer .org { font-size: 13px; font-weight: 600; color: rgba(255,255,255,0.8); margin-bottom: 6px !important; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>605 Wells Revival Hub</h1>
      <p>A Transformational Gathering Place · Jacksonville, FL</p>
    </div>
    <div class="event-banner">📅 ${eventTitle}</div>
    <div class="content">${personalizedBody}</div>
    <div class="divider"></div>
    <div class="footer">
      <p class="org">605 Wells Revival Hub</p>
      <p>Jacksonville, FL</p>
      <p style="margin-top:10px;">You are receiving this message because you registered for one of our events.</p>
    </div>
  </div>
</body>
</html>`
}
