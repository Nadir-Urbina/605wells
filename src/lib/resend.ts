import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Email templates
export const KINGDOM_BUILDER_EMAIL = (data: {
  firstName: string;
  lastName: string;
  amount: number;
  transactionId: string;
  subscriptionId: string;
  date: string;
  email: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome, Kingdom Builder!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .welcome-banner { background-color: #e879f9; color: #581c87; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
    .welcome-banner h2 { margin: 0 0 10px 0; font-size: 20px; }
    .content { padding: 20px 30px; color: #374151; line-height: 1.6; }
    .amount-section { background-color: #f3f4f6; text-align: center; padding: 30px; margin: 20px 0; border-radius: 12px; }
    .amount-section h3 { margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .amount { font-size: 36px; font-weight: bold; color: #8b5cf6; margin: 0; }
    .details { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; font-size: 14px; }
    .details div { margin: 5px 0; }
    .benefits { background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .benefits h3 { margin: 0 0 15px 0; color: #047857; }
    .benefits ul { margin: 0; padding-left: 20px; }
    .benefits li { margin: 8px 0; color: #065f46; }
    .next-steps { margin: 20px 0; }
    .next-steps ul { padding-left: 20px; }
    .next-steps li { margin: 10px 0; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <!-- Welcome Banner -->
    <div class="welcome-banner">
      <h2>🎉 Welcome, Kingdom Builder!</h2>
      <p>You've joined our mission to transform 605 Wells into a Kingdom hub!</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear ${data.firstName} ${data.lastName},</p>
      
      <p>Thank you for becoming a <strong>Kingdom Builder!</strong> Your monthly partnership is essential to creating a transformational gathering place where people are healed, built, and sent to impact God's Kingdom.</p>

      <!-- Monthly Partnership Amount -->
      <div class="amount-section">
        <h3>Monthly Partnership</h3>
        <div class="amount">$${data.amount.toFixed(2)}/month</div>
      </div>

      <!-- Transaction Details -->
      <div class="details">
        <div><strong>Transaction ID:</strong> ${data.transactionId}</div>
        <div><strong>Date:</strong> ${data.date}</div>
        <div><strong>Subscription ID:</strong> ${data.subscriptionId}</div>
        <div><strong>Email:</strong> ${data.email}</div>
      </div>

      <!-- Benefits -->
      <div class="benefits">
        <h3>🎁 Your Kingdom Builder Benefits</h3>
        <ul>
          <li><strong>50% off</strong> all registration fees within 605 Wells</li>
          <li><strong>Waived application fees</strong> for all trips and missions</li>
          <li><strong>Free admission</strong> to Kingdom Champions College</li>
          <li><strong>Exclusive updates</strong> on renovation progress and ministry impact</li>
          <li><strong>Priority access</strong> to special events and teaching series</li>
        </ul>
      </div>

      <!-- What's Next -->
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Your monthly support will automatically continue each month</li>
          <li>You'll receive progress updates on our renovation journey</li>
          <li>Watch for exclusive Kingdom Builder content and events</li>
          <li>No action needed - your partnership is now active!</li>
        </ul>
      </div>

      <p>Your faithfulness in sowing into this vision will bear fruit for generations. Together, we're building more than a facility - we're establishing a stronghold for the Kingdom of God.</p>

      <p>Blessings and deep gratitude,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep</p>
      <br>
      <p>Questions? Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></p>
      <br>
      <p style="font-size: 12px; opacity: 0.6;">This is a thank you message. Your official donation receipt will be sent separately by Stripe.<br>
      You can manage your subscription at any time by contacting us.<br>
      605 Wells is a registered nonprofit organization.</p>
    </div>
  </div>
</body>
</html>
`;

export const ONE_TIME_DONOR_EMAIL = (data: {
  firstName: string;
  lastName: string;
  amount: number;
  transactionId: string;
  date: string;
  email: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You for Your Generous Heart!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .content { padding: 20px 30px; color: #374151; line-height: 1.6; }
    .content h2 { color: #1f2937; margin: 0 0 20px 0; }
    .amount-section { background-color: #f3f4f6; text-align: center; padding: 30px; margin: 20px 0; border-radius: 12px; }
    .amount-section h3 { margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .amount { font-size: 36px; font-weight: bold; color: #8b5cf6; margin: 0; }
    .details { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; font-size: 14px; }
    .details div { margin: 5px 0; }
    .impact { background-color: #10b981; color: white; padding: 25px; margin: 20px 0; border-radius: 12px; text-align: center; }
    .impact h3 { margin: 0 0 15px 0; font-size: 20px; }
    .impact p { margin: 0; font-size: 16px; line-height: 1.5; }
    .cta-section { background-color: #ddd6fe; border: 2px solid #8b5cf6; padding: 25px; margin: 20px 0; border-radius: 12px; text-align: center; }
    .cta-section p { margin: 0 0 15px 0; font-size: 16px; color: #5b21b6; }
    .cta-button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; }
    .benefits { margin: 20px 0; }
    .benefits h4 { margin: 0 0 10px 0; color: #1f2937; }
    .benefits ul { margin: 0; padding-left: 20px; }
    .benefits li { margin: 5px 0; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <!-- Content -->
    <div class="content">
      <h2>Thank You for Your Generous Heart!</h2>
      
      <p>Dear ${data.firstName} ${data.lastName},</p>
      
      <p>Thank you for your generous gift to 605 Wells! Your donation helps us create a transformational gathering place where people are healed, built, and sent to impact the Kingdom of God.</p>

      <!-- Donation Amount -->
      <div class="amount-section">
        <h3>Donation Amount</h3>
        <div class="amount">$${data.amount.toFixed(2)}</div>
      </div>

      <!-- Transaction Details -->
      <div class="details">
        <div><strong>Transaction ID:</strong> ${data.transactionId}</div>
        <div><strong>Date:</strong> ${data.date}</div>
        <div><strong>Donation Type:</strong> One-Time Gift</div>
        <div><strong>Email:</strong> ${data.email}</div>
      </div>

      <!-- Impact Message -->
      <div class="impact">
        <h3>Your Impact</h3>
        <p>Your gift helps us renovate and transform 605 Wells Road into a hub for discipling, deliverance, inner healing, and regional Kingdom impact. Every dollar brings us closer to this vision!</p>
      </div>

      <!-- Kingdom Builder CTA -->
      <div class="cta-section">
        <p>Consider joining our <strong>Kingdom Builders</strong> community with a monthly partnership to maximize your impact:</p>
        <a href="https://605wells.com" class="cta-button">Become a Kingdom Builder</a>
      </div>

      <!-- Benefits -->
      <div class="benefits">
        <h4>Kingdom Builder Benefits:</h4>
        <ul>
          <li>50% off all registration fees within 605 Wells</li>
          <li>Waived application fees for trips</li>
          <li>Waived admission fee into Kingdom Champions College</li>
        </ul>
      </div>

      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep</p>
      <br>
      <p>Questions? Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></p>
      <br>
      <p style="font-size: 12px; opacity: 0.6;">This is a thank you message. Your official donation receipt will be sent separately by Stripe.<br>
      605 Wells is a registered nonprofit organization.</p>
    </div>
  </div>
</body>
</html>
`;

export const ONLINE_EVENT_REGISTRATION_CONFIRMATION = (data: {
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  date: string;
  email: string;
  registrationInstructions?: string;
  accessToken: string;
  livestreamUrl: string;
  finalPrice: number;
  originalPrice?: number;
  discountApplied?: boolean;
  promoCode?: string;
  promoCodeDiscount?: number;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Online Event Access Ready!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .confirmation-banner { background-color: #10b981; color: white; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
    .confirmation-banner h2 { margin: 0 0 10px 0; font-size: 20px; }
    .confirmation-banner p { margin: 0; font-size: 16px; }
    .content { padding: 20px 30px; color: #374151; line-height: 1.6; }
    .event-details { background-color: #f3f4f6; padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #8b5cf6; }
    .event-details h3 { margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px; }
    .event-details .detail-row { margin: 8px 0; display: flex; }
    .event-details .detail-label { font-weight: bold; width: 120px; color: #4b5563; }
    .event-details .detail-value { color: #1f2937; }
    .schedule-container { margin-top: 10px; }
    .schedule-session { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 8px 0; }
    .schedule-session strong { color: #8b5cf6; font-size: 16px; }
    .session-date { color: #4b5563; font-weight: 500; }
    .session-time { color: #6b7280; font-size: 14px; }
    .livestream-access { background-color: #ddd6fe; border-left: 4px solid #8b5cf6; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .livestream-access h3 { margin: 0 0 15px 0; color: #5b21b6; }
    .livestream-access .access-token { background-color: #f3f4f6; padding: 15px; border-radius: 8px; font-family: monospace; font-size: 14px; margin: 10px 0; border: 1px solid #d1d5db; }
    .livestream-link { background-color: #8b5cf6; color: white; padding: 15px 25px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; margin: 10px 0; }
    .livestream-link:hover { background-color: #7c3aed; }
    .pricing-summary { background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .pricing-summary h3 { margin: 0 0 15px 0; color: #1f2937; }
    .pricing-row { display: flex; justify-content: space-between; margin: 8px 0; }
    .pricing-row.total { font-weight: bold; font-size: 16px; color: #8b5cf6; border-top: 1px solid #e5e7eb; padding-top: 8px; margin-top: 15px; }
    .pricing-row.discount { color: #059669; }
    .pricing-row.original { color: #6b7280; text-decoration: line-through; }
    .instructions { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .instructions h3 { margin: 0 0 15px 0; color: #92400e; }
    .instructions p { margin: 10px 0; color: #78350f; }
    .next-steps { margin: 20px 0; }
    .next-steps h3 { color: #1f2937; margin-bottom: 15px; }
    .next-steps ul { padding-left: 20px; margin: 0; }
    .next-steps li { margin: 8px 0; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <!-- Confirmation Banner -->
    <div class="confirmation-banner">
      <h2>🎥 Online Access Ready!</h2>
      <p>Your livestream access for ${data.eventTitle} is confirmed</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear ${data.firstName},</p>
      
      <p>Thank you for registering for online access to <strong>${data.eventTitle}</strong>! You're all set to join us virtually.</p>

      <!-- Event Details -->
      <div class="event-details">
        <h3>📅 Event Information</h3>
        <div class="detail-row">
          <span class="detail-label">Event:</span>
          <span class="detail-value">${data.eventTitle}</span>
        </div>
        ${data.eventSchedule && data.eventSchedule.length > 1 ? `
        <div class="detail-row">
          <span class="detail-label">Schedule:</span>
          <div class="schedule-container">
            ${data.eventSchedule.map(session => `
              <div class="schedule-session">
                <strong>${session.sessionTitle || 'Session'}</strong><br>
                <span class="session-date">${session.date}</span><br>
                <span class="session-time">${session.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${data.eventTime}</span>
        </div>
        `}
        <div class="detail-row">
          <span class="detail-label">Access:</span>
          <span class="detail-value">Online Livestream</span>
        </div>
        ${data.eventLocation ? `
        <div class="detail-row">
          <span class="detail-label">Venue:</span>
          <span class="detail-value">${data.eventLocation}</span>
        </div>
        ` : ''}
      </div>

      <!-- Livestream Access -->
      <div class="livestream-access">
        <h3>🔐 Your Livestream Access</h3>
        <p>Use this secure link to access the livestream on event day:</p>
        
        <a href="${data.livestreamUrl}" class="livestream-link">
          🎥 Join Livestream
        </a>
        
        <p style="margin-top: 15px;"><strong>Access Token:</strong></p>
        <div class="access-token">${data.accessToken}</div>
        
        <p style="font-size: 14px; color: #6b7280; margin-top: 10px;">
          💡 <strong>Tip:</strong> Bookmark this email or save the link above. You'll need it to access the livestream on event day.
        </p>
      </div>

      <!-- Pricing Summary -->
      ${data.finalPrice > 0 ? `
      <div class="pricing-summary">
        <h3>💰 Registration Summary</h3>
        ${data.discountApplied && data.originalPrice ? `
        <div class="pricing-row original">
          <span>Original Price:</span>
          <span>$${data.originalPrice.toFixed(2)}</span>
        </div>
        <div class="pricing-row discount">
          <span>Discount Applied (${data.promoCode}):</span>
          <span>-$${(data.originalPrice - data.finalPrice).toFixed(2)}</span>
        </div>
        ` : ''}
        <div class="pricing-row total">
          <span>Total Paid:</span>
          <span>$${data.finalPrice.toFixed(2)}</span>
        </div>
      </div>
      ` : `
      <div class="pricing-summary">
        <h3>🎁 Free Online Access</h3>
        <div class="pricing-row total">
          <span>Total:</span>
          <span>FREE</span>
        </div>
      </div>
      `}

      <!-- Special Instructions -->
      ${data.registrationInstructions ? `
      <div class="instructions">
        <h3>📝 Important Information</h3>
        <p>${data.registrationInstructions}</p>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li><strong>Test your setup</strong> - Ensure you have a stable internet connection</li>
          <li><strong>Join early</strong> - Access will be available 15 minutes before start time</li>
          <li><strong>Engage with Q&A</strong> - Use the live chat to ask questions during the event</li>
          <li><strong>Technical support</strong> - Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a> if you need help</li>
        </ul>
      </div>

      <p>We're excited to have you join us online!</p>
      
      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep</p>
      <br>
      <p>Questions? Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></p>
      <br>
      <p style="font-size: 12px; opacity: 0.6;">Registration confirmed on ${data.date}<br>
      605 Wells • Jacksonville, FL</p>
    </div>
  </div>
</body>
</html>
`;

export const FREE_EVENT_REGISTRATION_CONFIRMATION = (data: {
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  date: string;
  email: string;
  registrationInstructions?: string;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Free Event Registration Confirmed!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .confirmation-banner { background-color: #10b981; color: white; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
    .confirmation-banner h2 { margin: 0 0 10px 0; font-size: 20px; }
    .confirmation-banner p { margin: 0; font-size: 16px; }
    .content { padding: 20px 30px; color: #374151; line-height: 1.6; }
    .event-details { background-color: #f3f4f6; padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #8b5cf6; }
    .event-details h3 { margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px; }
    .event-details .detail-row { margin: 8px 0; display: flex; }
    .event-details .detail-label { font-weight: bold; width: 120px; color: #4b5563; }
    .event-details .detail-value { color: #1f2937; }
    .schedule-container { margin-top: 10px; }
    .schedule-session { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 8px 0; }
    .schedule-session strong { color: #8b5cf6; font-size: 16px; }
    .session-date { color: #4b5563; font-weight: 500; }
    .session-time { color: #6b7280; font-size: 14px; }
    .free-badge { background-color: #10b981; color: white; padding: 15px; margin: 20px 0; border-radius: 12px; text-align: center; }
    .free-badge h3 { margin: 0 0 5px 0; font-size: 18px; }
    .free-badge p { margin: 0; font-size: 14px; opacity: 0.9; }
    .instructions { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .instructions h3 { margin: 0 0 15px 0; color: #92400e; }
    .instructions p { margin: 10px 0; color: #78350f; }
    .next-steps { margin: 20px 0; }
    .next-steps h3 { color: #1f2937; margin-bottom: 15px; }
    .next-steps ul { padding-left: 20px; margin: 0; }
    .next-steps li { margin: 8px 0; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <!-- Confirmation Banner -->
    <div class="confirmation-banner">
      <h2>🎉 Registration Confirmed!</h2>
      <p>You're all set for ${data.eventTitle}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear ${data.firstName},</p>
      
      <p>Thank you for registering! Your spot is confirmed for <strong>${data.eventTitle}</strong>. We're excited to see you there!</p>

      <!-- Event Details -->
      <div class="event-details">
        <h3>📅 Event Information</h3>
        <div class="detail-row">
          <span class="detail-label">Event:</span>
          <span class="detail-value">${data.eventTitle}</span>
        </div>
        ${data.eventSchedule && data.eventSchedule.length > 1 ? `
        <div class="detail-row">
          <span class="detail-label">Schedule:</span>
          <div class="schedule-container">
            ${data.eventSchedule.map(session => `
              <div class="schedule-session">
                <strong>${session.sessionTitle || 'Session'}</strong><br>
                <span class="session-date">${session.date}</span><br>
                <span class="session-time">${session.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${data.eventTime}</span>
        </div>
        `}
        ${data.eventLocation ? `
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${data.eventLocation}</span>
        </div>
        ` : ''}
        ${data.eventAddress ? `
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">${data.eventAddress}</span>
        </div>
        ` : ''}
      </div>

      <!-- Free Event Badge -->
      <div class="free-badge">
        <h3>🎁 FREE EVENT</h3>
        <p>No payment required - just bring yourself!</p>
      </div>

      <!-- Special Instructions -->
      ${data.registrationInstructions ? `
      <div class="instructions">
        <h3>📝 Important Information</h3>
        <p>${data.registrationInstructions}</p>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li><strong>Save the date</strong> - Add this event to your calendar</li>
          <li><strong>Arrive on time</strong> - Doors open 15 minutes before start time</li>
          <li><strong>Bring a friend</strong> - Share this event with others who might be interested</li>
          <li><strong>Questions?</strong> Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></li>
        </ul>
      </div>

      <p>We can't wait to see you at 605 Wells!</p>
      
      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep</p>
      <br>
      <p>Questions? Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></p>
      <br>
      <p style="font-size: 12px; opacity: 0.6;">Registration confirmed on ${data.date}<br>
      605 Wells • Jacksonville, FL</p>
    </div>
  </div>
</body>
</html>
`;

export const EVENT_REGISTRATION_CONFIRMATION = (data: {
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  finalPrice: number;
  originalPrice?: number;
  isKingdomBuilder: boolean;
  discountApplied: boolean;
  transactionId: string;
  date: string;
  email: string;
  registrationInstructions?: string;
  promoCode?: string;
  promoCodeDiscount?: number;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Event Registration Confirmed!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .header p { margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; }
    .confirmation-banner { background-color: #10b981; color: white; padding: 20px; margin: 20px; border-radius: 12px; text-align: center; }
    .confirmation-banner h2 { margin: 0 0 10px 0; font-size: 20px; }
    .confirmation-banner p { margin: 0; font-size: 16px; }
    .content { padding: 20px 30px; color: #374151; line-height: 1.6; }
    .event-details { background-color: #f3f4f6; padding: 25px; margin: 20px 0; border-radius: 12px; border-left: 4px solid #8b5cf6; }
    .event-details h3 { margin: 0 0 15px 0; color: #8b5cf6; font-size: 18px; }
    .event-details .detail-row { margin: 8px 0; display: flex; }
    .event-details .detail-label { font-weight: bold; width: 120px; color: #4b5563; }
    .event-details .detail-value { color: #1f2937; }
    .schedule-container { margin-top: 10px; }
    .schedule-session { background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 8px 0; }
    .schedule-session strong { color: #8b5cf6; font-size: 16px; }
    .session-date { color: #4b5563; font-weight: 500; }
    .session-time { color: #6b7280; font-size: 14px; }
    .price-section { background-color: #f9fafb; text-align: center; padding: 20px; margin: 20px 0; border-radius: 12px; }
    .price-section h3 { margin: 0 0 10px 0; color: #6b7280; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }
    .price { font-size: 24px; font-weight: bold; color: #8b5cf6; margin: 0; }
    .discount-info { background-color: #ecfdf5; border: 2px solid #10b981; padding: 20px; margin: 20px 0; border-radius: 12px; text-align: center; }
    .discount-info h3 { margin: 0 0 10px 0; color: #047857; }
    .discount-info p { margin: 0; color: #065f46; }
    .transaction-details { background-color: #f9fafb; padding: 20px; margin: 20px 0; border-radius: 8px; font-size: 14px; }
    .transaction-details div { margin: 5px 0; }
    .instructions { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .instructions h3 { margin: 0 0 15px 0; color: #92400e; }
    .instructions p { margin: 10px 0; color: #78350f; }
    .calendar-button { display: inline-block; background-color: #8b5cf6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; margin: 10px 0; }
    .next-steps { margin: 20px 0; }
    .next-steps h3 { color: #1f2937; margin-bottom: 15px; }
    .next-steps ul { padding-left: 20px; margin: 0; }
    .next-steps li { margin: 8px 0; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>605 Wells</h1>
      <p>A Transformational Gathering Place</p>
    </div>

    <!-- Confirmation Banner -->
    <div class="confirmation-banner">
      <h2>🎉 Registration Confirmed!</h2>
      <p>You're all set for ${data.eventTitle}</p>
    </div>

    <!-- Content -->
    <div class="content">
      <p>Dear ${data.firstName} ${data.lastName},</p>
      
      <p>Thank you for registering! Your spot is confirmed for <strong>${data.eventTitle}</strong>. We're excited to see you there!</p>

      <!-- Event Details -->
      <div class="event-details">
        <h3>📅 Event Information</h3>
        <div class="detail-row">
          <span class="detail-label">Event:</span>
          <span class="detail-value">${data.eventTitle}</span>
        </div>
        ${data.eventSchedule && data.eventSchedule.length > 1 ? `
        <div class="detail-row">
          <span class="detail-label">Schedule:</span>
          <div class="schedule-container">
            ${data.eventSchedule.map(session => `
              <div class="schedule-session">
                <strong>${session.sessionTitle || 'Session'}</strong><br>
                <span class="session-date">${session.date}</span><br>
                <span class="session-time">${session.time}</span>
              </div>
            `).join('')}
          </div>
        </div>
        ` : `
        <div class="detail-row">
          <span class="detail-label">Date:</span>
          <span class="detail-value">${data.eventDate}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Time:</span>
          <span class="detail-value">${data.eventTime}</span>
        </div>
        `}
        ${data.eventLocation ? `
        <div class="detail-row">
          <span class="detail-label">Location:</span>
          <span class="detail-value">${data.eventLocation}</span>
        </div>
        ` : ''}
        ${data.eventAddress ? `
        <div class="detail-row">
          <span class="detail-label">Address:</span>
          <span class="detail-value">${data.eventAddress}</span>
        </div>
        ` : ''}
      </div>

      <!-- Price Information -->
      ${data.finalPrice > 0 ? `
      <div class="price-section">
        <h3>Registration Fee</h3>
        ${data.discountApplied ? `
          <div style="text-decoration: line-through; color: #6b7280; font-size: 16px; margin-bottom: 5px;">
            Original: $${data.originalPrice?.toFixed(2) || data.finalPrice.toFixed(2)}
          </div>
        ` : ''}
        <div class="price">$${data.finalPrice.toFixed(2)}</div>
      </div>
      ` : `
      <div class="price-section">
        <h3>Registration Fee</h3>
        <div class="price" style="color: #10b981;">FREE EVENT</div>
      </div>
      `}

      <!-- Discount Information -->
      ${data.discountApplied ? `
      <div class="discount-info">
        ${data.promoCode ? `
          <h3>🎁 Promo Code Discount Applied!</h3>
          <p><strong>Code Used:</strong> ${data.promoCode}</p>
          <p>You saved ${data.promoCodeDiscount ? `$${data.promoCodeDiscount.toFixed(2)}` : '50%'} with your promo code!</p>
        ` : data.isKingdomBuilder ? `
          <h3>🎁 Kingdom Builder Discount Applied!</h3>
          <p>You saved ${data.originalPrice && data.finalPrice ? `$${(data.originalPrice - data.finalPrice).toFixed(2)}` : '50%'} with your Kingdom Builder membership!</p>
        ` : `
          <h3>🎁 Discount Applied!</h3>
          <p>You saved ${data.originalPrice && data.finalPrice ? `$${(data.originalPrice - data.finalPrice).toFixed(2)}` : ''} on your registration!</p>
        `}
      </div>
      ` : ''}

      <!-- Transaction Details -->
      ${data.finalPrice > 0 ? `
      <div class="transaction-details">
        <div><strong>Transaction ID:</strong> ${data.transactionId}</div>
        <div><strong>Registration Date:</strong> ${data.date}</div>
        <div><strong>Email:</strong> ${data.email}</div>
      </div>
      ` : ''}

      <!-- Special Instructions -->
      ${data.registrationInstructions ? `
      <div class="instructions">
        <h3>📝 Important Information</h3>
        <p>${data.registrationInstructions}</p>
      </div>
      ` : ''}

      <!-- Next Steps -->
      <div class="next-steps">
        <h3>What's Next?</h3>
        <ul>
          <li>Save this confirmation email for your records</li>
          <li>Add the event to your calendar using the date and time above</li>
          <li>Arrive 15 minutes early for check-in</li>
          <li>Bring a valid photo ID if required</li>
          ${data.eventLocation ? `<li>Plan your route to ${data.eventLocation}</li>` : ''}
        </ul>
      </div>

      <p>If you have any questions about this event, please don't hesitate to contact us. We're looking forward to an incredible time together!</p>

      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
    </div>

    <!-- Footer -->
    <div class="footer">
      <h3>605 Wells</h3>
      <p>A Transformational Gathering Place</p>
      <p>Where the Waters Run Deep</p>
      <br>
      <p>Questions? Contact us at <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a></p>
      <br>
      <p style="font-size: 12px; opacity: 0.6;">This is your event registration confirmation. Keep this email for your records.<br>
      ${data.finalPrice > 0 ? 'Your payment receipt has been sent separately by Stripe.<br>' : ''}
      605 Wells is a registered nonprofit organization.</p>
    </div>
  </div>
</body>
</html>
`;

// Email sending functions
export async function sendKingdomBuilderWelcomeEmail(data: {
  email: string;
  firstName: string;
  lastName: string;
  amount: number;
  transactionId: string;
  subscriptionId: string;
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.email],
      subject: '🎉 Welcome to Kingdom Builders - Your Partnership is Active!',
      html: KINGDOM_BUILDER_EMAIL({
        ...data,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }),
    });

    if (error) {
      console.error('Failed to send Kingdom Builder welcome email:', error);
      throw error;
    }

    console.log('✅ Kingdom Builder welcome email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending Kingdom Builder welcome email:', error);
    throw error;
  }
}

export async function sendOneTimeDonorThankYou(data: {
  email: string;
  firstName: string;
  lastName: string;
  amount: number;
  transactionId: string;
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.email],
      subject: 'Thank You for Your Generous Heart! 💖',
      html: ONE_TIME_DONOR_EMAIL({
        ...data,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }),
    });

    if (error) {
      console.error('Failed to send one-time donor thank you email:', error);
      throw error;
    }

    console.log('✅ One-time donor thank you email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending one-time donor thank you email:', error);
    throw error;
  }
}

export async function sendOnlineEventRegistrationConfirmation(data: {
  email: string;
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  registrationInstructions?: string;
  accessToken: string;
  livestreamUrl: string;
  finalPrice: number;
  originalPrice?: number;
  discountApplied?: boolean;
  promoCode?: string;
  promoCodeDiscount?: number;
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.email],
      subject: `🎥 Online Access Ready: ${data.eventTitle}`,
      html: ONLINE_EVENT_REGISTRATION_CONFIRMATION({
        ...data,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }),
    });

    if (error) {
      console.error('Failed to send online event registration confirmation email:', error);
      throw error;
    }

    console.log('✅ Online event registration confirmation email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending online event registration confirmation email:', error);
    throw error;
  }
}

export async function sendFreeEventRegistrationConfirmation(data: {
  email: string;
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  registrationInstructions?: string;
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.email],
      subject: `🎉 Registration Confirmed: ${data.eventTitle}`,
      html: FREE_EVENT_REGISTRATION_CONFIRMATION({
        ...data,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }),
    });

    if (error) {
      console.error('Failed to send free event registration confirmation email:', error);
      throw error;
    }

    console.log('✅ Free event registration confirmation email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending free event registration confirmation email:', error);
    throw error;
  }
}

export async function sendEventRegistrationConfirmation(data: {
  email: string;
  firstName: string;
  lastName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  eventSchedule?: Array<{
    sessionTitle?: string;
    date: string;
    time: string;
    startTime: string;
    endTime: string;
  }>;
  eventLocation?: string;
  eventAddress?: string;
  finalPrice: number;
  originalPrice?: number;
  isKingdomBuilder: boolean;
  discountApplied: boolean;
  transactionId: string;
  registrationInstructions?: string;
  promoCode?: string;
  promoCodeDiscount?: number;
}) {
  try {
    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.email],
      subject: `🎉 Registration Confirmed: ${data.eventTitle}`,
      html: EVENT_REGISTRATION_CONFIRMATION({
        ...data,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })
      }),
    });

    if (error) {
      console.error('Failed to send event registration confirmation email:', error);
      throw error;
    }

    console.log('✅ Event registration confirmation email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending event registration confirmation email:', error);
    throw error;
  }
}

// Past Event Access Confirmation Email
interface PastEventAccessEmailData {
  toEmail: string;
  attendeeName: string;
  pastEventTitle: string;
  pastEventSlug: string;
  accessToken: string;
  eventDate: string;
  duration?: string;
  speakers?: string[];
  price: number;
}

export async function sendPastEventAccessConfirmation(data: PastEventAccessEmailData) {
  try {
    const watchUrl = `${process.env.NEXT_PUBLIC_BASE_URL || 'https://www.605wells.com'}/past-events/${data.pastEventSlug}/watch?token=${data.accessToken}`;

    const eventDateFormatted = new Date(data.eventDate).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const { data: emailData, error } = await resend.emails.send({
      from: '605 Wells <noreply@605wells.com>',
      to: [data.toEmail],
      subject: `🎥 Your Access is Ready: ${data.pastEventTitle}`,
      html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Access Ready - ${data.pastEventTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; }
    .header { background-color: #8b5cf6; color: white; text-align: center; padding: 40px 20px; }
    .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
    .confirmation-banner { background-color: #10b981; color: white; padding: 15px; text-align: center; font-weight: 600; }
    .content { padding: 30px; color: #374151; line-height: 1.6; }
    .event-title { font-size: 24px; font-weight: bold; color: #1f2937; margin: 0 0 20px 0; }
    .watch-button { display: inline-block; background-color: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; }
    .watch-button:hover { background-color: #7c3aed; }
    .info-box { background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info-box h3 { margin: 0 0 10px 0; color: #1f2937; font-size: 16px; }
    .info-item { margin: 8px 0; color: #4b5563; font-size: 14px; }
    .token-box { background-color: #eff6ff; border: 2px solid #3b82f6; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .token-box h3 { margin: 0 0 10px 0; color: #1e40af; font-size: 14px; }
    .token { font-family: 'Courier New', monospace; background-color: white; padding: 12px; border-radius: 4px; word-break: break-all; font-size: 12px; color: #1f2937; }
    .speakers-list { background-color: #fef3c7; padding: 15px; border-radius: 8px; border-left: 4px solid #f59e0b; margin: 20px 0; }
    .speakers-list h3 { margin: 0 0 10px 0; color: #92400e; font-size: 16px; }
    .speakers-list ul { margin: 0; padding-left: 20px; }
    .speakers-list li { color: #78350f; margin: 5px 0; }
    .important-box { background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0; }
    .important-box h3 { margin: 0 0 10px 0; color: #92400e; }
    .important-box ul { margin: 0; padding-left: 20px; }
    .important-box li { color: #78350f; margin: 8px 0; }
    .price-summary { background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .price-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 16px; }
    .price-total { font-weight: bold; font-size: 20px; color: #8b5cf6; padding-top: 10px; border-top: 2px solid #e5e7eb; }
    .footer { background-color: #1f2937; color: white; text-align: center; padding: 30px; }
    .footer h3 { margin: 0 0 10px 0; font-size: 18px; }
    .footer p { margin: 5px 0; opacity: 0.8; font-size: 14px; }
    .contact-link { color: #8b5cf6; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>605 Wells</h1>
    </div>

    <div class="confirmation-banner">
      ✅ Your Access is Ready!
    </div>

    <div class="content">
      <h2 class="event-title">${data.pastEventTitle}</h2>

      <p>Hello ${data.attendeeName},</p>

      <p>Thank you for your purchase! Your access to this event recording is now active. You can start watching immediately.</p>

      <div style="text-align: center;">
        <a href="${watchUrl}" class="watch-button">
          ▶️ Watch Now
        </a>
      </div>

      <div class="info-box">
        <h3>Event Details</h3>
        <div class="info-item"><strong>Event:</strong> ${data.pastEventTitle}</div>
        <div class="info-item"><strong>Original Date:</strong> ${eventDateFormatted}</div>
        ${data.duration ? `<div class="info-item"><strong>Duration:</strong> ${data.duration}</div>` : ''}
      </div>

      ${data.speakers && data.speakers.length > 0 ? `
      <div class="speakers-list">
        <h3>Featured Speakers</h3>
        <ul>
          ${data.speakers.map(speaker => `<li>${speaker}</li>`).join('')}
        </ul>
      </div>
      ` : ''}

      ${data.price > 0 ? `
      <div class="price-summary">
        <div class="price-row price-total">
          <span>Amount Paid:</span>
          <span>$${data.price.toFixed(2)}</span>
        </div>
      </div>
      ` : ''}

      <div class="token-box">
        <h3>🔑 Your Access Token</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #1e40af;">Save this token in case you need it later:</p>
        <div class="token">${data.accessToken}</div>
      </div>

      <div class="important-box">
        <h3>⭐ Important Information</h3>
        <ul>
          <li><strong>Unlimited Access:</strong> Watch this recording as many times as you'd like</li>
          <li><strong>Bookmark This Page:</strong> Save the watch link for easy access anytime</li>
          <li><strong>Keep This Email:</strong> Your access token is included above</li>
          <li><strong>No Expiration:</strong> Your access never expires</li>
        </ul>
      </div>

      <p>If you have any questions or need assistance, please don't hesitate to reach out to us.</p>

      <p style="margin-top: 30px;">
        Blessings,<br>
        <strong>The 605 Wells Team</strong>
      </p>
    </div>

    <div class="footer">
      <h3>605 Wells</h3>
      <p>Jacksonville, FL</p>
      <p>
        Questions? Email us at
        <a href="mailto:info@605wells.com" class="contact-link">info@605wells.com</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; opacity: 0.7;">
        This email was sent because you purchased access to ${data.pastEventTitle}
      </p>
    </div>
  </div>
</body>
</html>
      `,
    });

    if (error) {
      console.error('Failed to send past event access confirmation email:', error);
      throw error;
    }

    console.log('✅ Past event access confirmation email sent:', emailData?.id);
    return { success: true, id: emailData?.id };
  } catch (error) {
    console.error('Error sending past event access confirmation email:', error);
    throw error;
  }
} 