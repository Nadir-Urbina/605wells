import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

// Admin notification email template
const ADMIN_NOTIFICATION_EMAIL = (data: {
  name: string;
  email: string;
  phone?: string;
  message: string;
  timestamp: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Contact Form Submission</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { background-color: #8b5cf6; color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .field { margin-bottom: 20px; }
    .label { font-weight: bold; color: #374151; margin-bottom: 5px; display: block; }
    .value { background-color: #f9fafb; padding: 10px; border-radius: 4px; border-left: 3px solid #8b5cf6; }
    .message-value { background-color: #f9fafb; padding: 15px; border-radius: 4px; border-left: 3px solid #8b5cf6; white-space: pre-wrap; }
    .footer { background-color: #f3f4f6; padding: 15px; text-align: center; color: #6b7280; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>New Contact Form Submission</h1>
      <p>605 Wells Ministry Hub</p>
    </div>
    
    <div class="content">
      <div class="field">
        <span class="label">Name:</span>
        <div class="value">${data.name}</div>
      </div>
      
      <div class="field">
        <span class="label">Email:</span>
        <div class="value">${data.email}</div>
      </div>
      
      ${data.phone ? `
      <div class="field">
        <span class="label">Phone:</span>
        <div class="value">${data.phone}</div>
      </div>
      ` : ''}
      
      <div class="field">
        <span class="label">Message:</span>
        <div class="message-value">${data.message}</div>
      </div>
      
      <div class="field">
        <span class="label">Submitted:</span>
        <div class="value">${data.timestamp}</div>
      </div>
    </div>
    
    <div class="footer">
      Please respond to this inquiry promptly. Reply directly to ${data.email}
    </div>
  </div>
</body>
</html>
`;

// User confirmation email template
const USER_CONFIRMATION_EMAIL = (name: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Thank You for Contacting 605 Wells</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 30px; color: #374151; line-height: 1.6; }
    .thank-you { background-color: #ddd6fe; color: #5b21b6; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
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
        <h2 style="margin: 0 0 10px 0;">Thank You!</h2>
        <p style="margin: 0;">We've received your message and will get back to you soon.</p>
      </div>
      
      <p>Dear ${name},</p>
      
      <p>Thank you for reaching out to 605 Wells! We're grateful for your interest in our ministry and the Kingdom work happening here.</p>
      
      <p>We've received your message and will respond within 24-48 hours. In the meantime, feel free to explore our website to learn more about:</p>
      
      <ul>
        <li><strong>Upcoming Events</strong> - Join us for transformational gatherings</li>
        <li><strong>Kingdom Builder Partnership</strong> - Become part of our mission</li>
        <li><strong>Ministry Activities</strong> - Discipling, deliverance, and equipping</li>
      </ul>
      
      <p>We're excited to connect with you and share how God is moving at 605 Wells!</p>
      
      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>
    
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep • Where People Are Healed, Built, and Sent</p>
      <br>
      <p>605 Wells Road, Jacksonville, FL</p>
      <p>Email: <a href="mailto:admin@eastgatejax.com" class="contact-link">admin@eastgatejax.com</a></p>
    </div>
  </div>
</body>
</html>
`;

// Verify reCAPTCHA token
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    console.error('RECAPTCHA_SECRET_KEY is not configured');
    return false;
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
    // Scores below 0.5 are likely bots
    return data.success && data.score >= 0.5;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error);
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, message, recaptchaToken } = body;

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
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

    // Verify reCAPTCHA token
    if (!recaptchaToken) {
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 400 }
      );
    }

    const isHuman = await verifyRecaptcha(recaptchaToken);
    if (!isHuman) {
      console.warn('Potential bot submission blocked:', { name, email });
      return NextResponse.json(
        { error: 'reCAPTCHA verification failed. Please try again.' },
        { status: 403 }
      );
    }

    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short'
    });

    // Send notification email to admin
    const adminEmailResult = await resend.emails.send({
      from: '605 Wells Contact Form <noreply@605wells.com>',
      to: ['admin@eastgatejax.com'],
      replyTo: email,
      subject: `New Contact Form Submission from ${name}`,
      html: ADMIN_NOTIFICATION_EMAIL({
        name,
        email,
        phone,
        message,
        timestamp
      }),
    });

    if (adminEmailResult.error) {
      console.error('Failed to send admin notification:', adminEmailResult.error);
      throw new Error('Failed to send admin notification');
    }

    // Send confirmation email to user
    const userEmailResult = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [email],
      subject: 'Thank You for Contacting 605 Wells!',
      html: USER_CONFIRMATION_EMAIL(name),
    });

    if (userEmailResult.error) {
      console.error('Failed to send user confirmation:', userEmailResult.error);
      // Don't throw here - admin notification is more important
    }

    console.log('✅ Contact form emails sent successfully');
    console.log('Admin notification ID:', adminEmailResult.data?.id);
    console.log('User confirmation ID:', userEmailResult.data?.id);

    return NextResponse.json({
      message: 'Contact form submitted successfully',
      adminEmailId: adminEmailResult.data?.id,
      userEmailId: userEmailResult.data?.id
    });

  } catch (error) {
    console.error('Contact form submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit contact form. Please try again.' },
      { status: 500 }
    );
  }
} 