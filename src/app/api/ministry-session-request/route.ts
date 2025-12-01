import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Admin notification email template
const MINISTRY_SESSION_REQUEST_EMAIL = (data: {
  fullName: string;
  email: string;
  phone: string;
  ministryRequested: string;
  salvationExperience: string;
  localChurch: string;
  baptizedInHolySpirit: string;
  reasonForMinistry: string;
  timestamp: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Ministry Session Request</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 700px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: #8b5cf6; color: white; padding: 25px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 30px; }
    .field { margin-bottom: 25px; }
    .label { font-weight: bold; color: #374151; margin-bottom: 8px; display: block; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; }
    .value { background-color: #f9fafb; padding: 12px; border-radius: 4px; border-left: 4px solid #8b5cf6; color: #1f2937; }
    .textarea-value { background-color: #f9fafb; padding: 15px; border-radius: 4px; border-left: 4px solid #8b5cf6; white-space: pre-wrap; min-height: 60px; line-height: 1.6; }
    .footer { background-color: #f3f4f6; padding: 20px; text-align: center; color: #6b7280; font-size: 12px; }
    .highlight { background-color: #ddd6fe; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .highlight .label { color: #5b21b6; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🙏 New Ministry Session Request</h1>
      <p style="margin: 5px 0 0 0; opacity: 0.9;">605 Wells Ministry</p>
    </div>

    <div class="content">
      <div class="field">
        <span class="label">Full Name</span>
        <div class="value">${data.fullName}</div>
      </div>

      <div class="field">
        <span class="label">Email Address</span>
        <div class="value"><a href="mailto:${data.email}" style="color: #8b5cf6; text-decoration: none;">${data.email}</a></div>
      </div>

      <div class="field">
        <span class="label">Phone Number</span>
        <div class="value"><a href="tel:${data.phone}" style="color: #8b5cf6; text-decoration: none;">${data.phone}</a></div>
      </div>

      <div class="highlight">
        <div class="field" style="margin-bottom: 0;">
          <span class="label">Ministry Requested</span>
          <div class="value" style="background-color: white; font-size: 16px; font-weight: 600; color: #5b21b6;">${data.ministryRequested}</div>
        </div>
      </div>

      <div class="field">
        <span class="label">How was your salvation experience</span>
        <div class="textarea-value">${data.salvationExperience}</div>
      </div>

      <div class="field">
        <span class="label">Local Church</span>
        <div class="value">${data.localChurch}</div>
      </div>

      <div class="field">
        <span class="label">Baptized in the Holy Spirit</span>
        <div class="value">${data.baptizedInHolySpirit}</div>
      </div>

      <div class="field">
        <span class="label">Why do you feel you need this ministry time?</span>
        <div class="textarea-value">${data.reasonForMinistry}</div>
      </div>

      <div class="field">
        <span class="label">Submitted</span>
        <div class="value">${data.timestamp}</div>
      </div>
    </div>

    <div class="footer">
      <p><strong>Ministry Session Request Notification</strong></p>
      <p>Please review and respond to this request promptly.</p>
      <p>Reply directly to <a href="mailto:${data.email}" style="color: #8b5cf6;">${data.email}</a></p>
    </div>
  </div>
</body>
</html>
`;

// User confirmation email template
const USER_CONFIRMATION_EMAIL = (fullName: string, ministryRequested: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Ministry Session Request Received</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px; color: #374151; line-height: 1.6; }
    .thank-you { background-color: #ddd6fe; color: #5b21b6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
    .ministry-box { background-color: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0; text-align: center; }
    .ministry-box strong { color: #8b5cf6; font-size: 18px; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <div class="content">
      <div class="thank-you">
        <h2 style="margin: 0 0 10px 0;">Request Received!</h2>
        <p style="margin: 0;">We've received your ministry session request.</p>
      </div>

      <p>Dear ${fullName},</p>

      <p>Thank you for reaching out to 605 Wells for ministry. We're honored that you trust us to walk alongside you in this season.</p>

      <div class="ministry-box">
        <p style="margin: 0 0 8px 0; font-size: 14px; color: #6b7280;">Ministry Requested</p>
        <strong>${ministryRequested}</strong>
      </div>

      <p>Our ministry team will review your request and contact you within next few days. We're committed to providing a safe, confidential, and Spirit-led environment for your ministry time.</p>

      <p><strong>What to expect:</strong></p>
      <ul>
        <li>A member of our ministry team will reach out to you</li>
        <li>We'll schedule a convenient time for your session</li>
        <li>All sessions are confidential and Spirit-led</li>
        <li>We're here to support you in your journey</li>
      </ul>

      <p>In the meantime, we encourage you to spend time in prayer and worship, preparing your heart for what God wants to do.</p>

      <p>If you have any urgent questions, please don't hesitate to contact us.</p>

      <p>Blessings and peace,<br>
      <strong>The 605 Wells Ministry Team</strong></p>
    </div>

    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep • Where People Are Healed, Built, and Sent</p>
      <br>
      <p>605 Wells Road, Orange Park, FL</p>
      <p>Email: <a href="mailto:admin@eastgatejax.com" class="contact-link">admin@eastgatejax.com</a></p>
    </div>
  </div>
</body>
</html>
`;

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<{ success: boolean; score?: number }> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured');
    return { success: false };
  }

  try {
    const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();

    // For reCAPTCHA v3, check score (0.0 to 1.0, higher is better)
    const isHuman = data.success && data.score >= 0.7;

    console.log('reCAPTCHA verification:', {
      success: data.success,
      score: data.score,
      passed: isHuman
    });

    return { success: isHuman, score: data.score };
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return { success: false };
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      email,
      phone,
      ministryRequested,
      salvationExperience,
      localChurch,
      baptizedInHolySpirit,
      reasonForMinistry,
      recaptchaToken,
      honeypot
    } = body;

    // Honeypot check - if filled, it's a bot
    if (honeypot) {
      console.warn('Bot detected via honeypot:', { fullName, email });
      return NextResponse.json(
        { error: 'Invalid submission' },
        { status: 403 }
      );
    }

    // Validate required fields
    if (!fullName || !email || !phone || !ministryRequested || !salvationExperience ||
        !localChurch || !baptizedInHolySpirit || !reasonForMinistry) {
      return NextResponse.json(
        { error: 'All fields are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address' },
        { status: 400 }
      );
    }

    // Validate US phone number format (basic validation)
    const phoneRegex = /^[\d\s\-\(\)\+\.]+$/;
    if (!phoneRegex.test(phone)) {
      return NextResponse.json(
        { error: 'Please provide a valid phone number' },
        { status: 400 }
      );
    }

    // Verify reCAPTCHA token (skip in development)
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (!isDevelopment) {
      if (!recaptchaToken) {
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 400 }
        );
      }

      const recaptchaResult = await verifyRecaptcha(recaptchaToken);
      if (!recaptchaResult.success) {
        console.warn('Bot submission blocked by reCAPTCHA:', {
          fullName,
          email,
          score: recaptchaResult.score
        });
        return NextResponse.json(
          { error: 'reCAPTCHA verification failed. Please try again.' },
          { status: 403 }
        );
      }
    } else {
      console.log('⚠️  Development mode: Skipping reCAPTCHA verification');
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send notification email to ministry team
    const adminEmailResult = await resend.emails.send({
      from: '605 Wells Ministry Request <ministry-form@605wells.com>',
      to: ['nurbinabr@eastgatejax.com', 'drjoshuatodd@eastgatejax.com', 'wrighte8383@gmail.com'],
      replyTo: email,
      subject: `New Ministry Session Request: ${ministryRequested} - ${fullName}`,
      html: MINISTRY_SESSION_REQUEST_EMAIL({
        fullName,
        email,
        phone,
        ministryRequested,
        salvationExperience,
        localChurch,
        baptizedInHolySpirit,
        reasonForMinistry,
        timestamp
      }),
    });

    if (adminEmailResult.error) {
      console.error('Failed to send ministry team notification:', adminEmailResult.error);
      throw new Error('Failed to send ministry team notification');
    }

    // Send confirmation email to user
    const userEmailResult = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [email],
      subject: 'Your Ministry Session Request - 605 Wells',
      html: USER_CONFIRMATION_EMAIL(fullName, ministryRequested),
    });

    if (userEmailResult.error) {
      console.error('Failed to send user confirmation:', userEmailResult.error);
      // Don't throw here - admin notification is more important
    }

    console.log('✅ Ministry session request emails sent successfully');
    console.log('Admin notification ID:', adminEmailResult.data?.id);
    console.log('User confirmation ID:', userEmailResult.data?.id);

    return NextResponse.json({
      message: 'Ministry session request submitted successfully',
      adminEmailId: adminEmailResult.data?.id,
      userEmailId: userEmailResult.data?.id
    });

  } catch (error) {
    console.error('Ministry session request submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit request. Please try again.' },
      { status: 500 }
    );
  }
}
