import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const allRecipients = [
  'dhoush_18@yahoo.com',
  'forensicsowens@gmail.com',
  'dwayne124@gmail.com',
  'tcoile26@hotmail.com',
  'tcjax@me.com',
  'pandadulane@yahoo.com',
  'Joshwa@lifeatvillage.com',
  'debjhen@gmail.com',
  'GennadioAndrew@gmail.com',
  'csimagine@gmail.com',
  'SoWaitaButterflyFlyy@yahoo.com',
  'jacquis14@aol.com',
  'mssara0704@gmail.com',
  'laneyr.right@gmail.com',
  'operations@605wells.com',
  'idancecrldoe@yahoo.com',
  'fitnmack$@aol.com',
  'turners.two@gmail.com',
  'dlwilliams904@outlook.com',
  'kimwargi@aol.com',
  'ljankifamily@yahoo.com',
  'hevans_31@yahoo.com',
  'pastorelaine@gmail.com',
  'primacesbrianna@gmail.com',
  'sarahjonathanjoshua@gmail.com',
  'sophieroads@gmail.com',
  'dougsteadman@icloud.com',
  'hblank78@gmail.com',
  'greenmailed@gmail.com',
  'Annabel0@me.com',
  'ramaro8@gmail.com',
  'showg8oot@me.com',
  'sarahd@thrivejax.org',
  'blanka-scott@hotmail.com',
  'mandarinaforrest@att.net',
  'mononutridges@gmail.com',
  'jhannamo1@aol.com',
  'hipsaie@gmail.com',
  'wilkrd30@gmail.com',
  'jisaactucker@gmail.com',
  'jisadarrell318@yahoo.com',
  'yshae.debose@gmail.com',
  'daniellagooden@gmail.com',
  'nzwike@aol.com',
  'tashunda3@gmail.com',
  'formica03@gmail.com',
  'jamilabrush@gmail.com',
  'pastortdm@yahoo.com',
  'nicole@paradisedaycarenow.com',
  'Iamjehia@gmail.com',
  'naub_2@hotmail.com',
  'paseycooper1@gmail.com',
  'dennis.habian@gmail.com',
  'tracelet@iheartradio.com',
  'akayladior20@gmail.com',
  'founder@cherish4girls.org',
  'nir8977@gmail.com',
  'boandisharon2@att.net',
  'janetk243@gmail.com',
  'greatuigirino@gmail.com',
  'rivert5a@yahoo.com',
  'kristib2911@gmail.com',
  'clozierrc@gmail.com',
  'livindreal@gmail.com',
  'shepard.barbara@gmail.com',
  'sunkitialou@yahoo.com',
  'burlyis1z@gmail.com',
  'laquanab@gmail.com',
  'sgchapin@stpaulsjax.org',
  'kimherrera67@gmail.com',
  'michelle.herr@gmail.com',
  'kwgrace@icloud.com',
  'benjaminhivner@gmail.com',
  'bsheats411@gmail.com',
  'hblank78@gmail.com',
  'noreene72@gmail.com',
  'tracyperez@comcast.net',
  'windystrom@gmail.com',
  'peterrose4522@gmail.com',
  'Jbailouie1111@gmail.com',
  'mdjones@usf.edu',
  'Chris-d.battle@att.net',
  'luislee04@gmail.com',
  'luis6623@gmail.com',
  'cindreanzidore@gmail.com',
  'mwbebohall@gmail.com',
  'hholliday@duvalschools.org',
  'connect@ccliv.tv',
  'rolandr@dpi.mil',
  'Cynthia.Draper@amwater.com',
  'naub_2@hotmail.com'
];

const emailSubject = 'Important: Radical Roundtable Event Time Correction';

const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background-color: #2c5282;
      color: white;
      padding: 20px;
      text-align: center;
      border-radius: 5px 5px 0 0;
    }
    .content {
      background-color: #f7fafc;
      padding: 30px;
      border: 1px solid #e2e8f0;
      border-top: none;
      border-radius: 0 0 5px 5px;
    }
    .highlight {
      background-color: #fff5f5;
      border-left: 4px solid #fc8181;
      padding: 15px;
      margin: 20px 0;
    }
    .correct-time {
      background-color: #f0fff4;
      border-left: 4px solid #48bb78;
      padding: 15px;
      margin: 20px 0;
      font-weight: bold;
      font-size: 18px;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Radical Roundtable Event Reminder</h1>
  </div>
  <div class="content">
    <p>Dear Friend,</p>

    <p>We're excited to see you at the upcoming <strong>Radical Roundtable</strong> event! We're reaching out because some of our early registrants received incorrect time information.</p>

    <div class="highlight">
      <strong>⚠️ Time Correction Notice</strong>
      <p>If you received earlier communication with different times, please disregard it.</p>
    </div>

    <div class="correct-time">
      📅 Correct Event Time:<br>
      2:00 PM - 6:00 PM EST
    </div>

    <p><strong>Event Details:</strong></p>
    <ul>
      <li><strong>Date:</strong> Early November (as per your registration)</li>
      <li><strong>Time:</strong> 2:00 PM - 6:00 PM EST</li>
      <li><strong>Format:</strong> Available for both in-person and online attendance</li>
    </ul>

    <p>We apologize for any confusion this may have caused. If you have any questions or concerns about your registration, please don't hesitate to reach out to us.</p>

    <p>We're looking forward to an amazing time of fellowship and discussion!</p>

    <div class="footer">
      <p>Blessings,<br>
      <strong>The 605 Wells Team</strong></p>
      <p>📧 For questions, reply to this email or contact us at operations@605wells.com</p>
    </div>
  </div>
</body>
</html>
`;

const emailText = `
Radical Roundtable Event Reminder

Dear Friend,

We're excited to see you at the upcoming Radical Roundtable event! We're reaching out because some of our early registrants received incorrect time information.

⚠️ TIME CORRECTION NOTICE
If you received earlier communication with different times, please disregard it.

CORRECT EVENT TIME:
2:00 PM - 6:00 PM EST

Event Details:
- Date: Early November (as per your registration)
- Time: 2:00 PM - 6:00 PM EST
- Format: Available for both in-person and online attendance

We apologize for any confusion this may have caused. If you have any questions or concerns about your registration, please don't hesitate to reach out to us.

We're looking forward to an amazing time of fellowship and discussion!

Blessings,
The 605 Wells Team

For questions, reply to this email or contact us at operations@605wells.com
`;

async function sendEmail(to: string | string[], isTest: boolean = false) {
  try {
    const { data, error } = await resend.emails.send({
      from: '605 Wells <events@605wells.com>',
      to: Array.isArray(to) ? to : [to],
      subject: isTest ? `[TEST] ${emailSubject}` : emailSubject,
      html: emailHtml,
      text: emailText,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error };
    }

    console.log('Email sent successfully:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Exception sending email:', error);
    return { success: false, error };
  }
}

async function main() {
  const args = process.argv.slice(2);
  const mode = args[0]; // 'test' or 'send'

  if (!process.env.RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY is not set in environment variables');
    process.exit(1);
  }

  if (mode === 'test') {
    console.log('📧 Sending TEST email to naub_2@hotmail.com...\n');
    const result = await sendEmail('naub_2@hotmail.com', true);

    if (result.success) {
      console.log('✅ Test email sent successfully!');
      console.log('📬 Check naub_2@hotmail.com and run with "send" argument to send to all recipients');
    } else {
      console.log('❌ Failed to send test email');
    }
  } else if (mode === 'send') {
    console.log(`📧 Sending emails to ${allRecipients.length} recipients...\n`);
    console.log('⚠️  This will send real emails. Press Ctrl+C to cancel or wait 5 seconds to continue...\n');

    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('🚀 Starting to send emails...\n');

    // Send in batches to avoid rate limiting
    const batchSize = 10;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < allRecipients.length; i += batchSize) {
      const batch = allRecipients.slice(i, i + batchSize);
      console.log(`Sending batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(allRecipients.length / batchSize)}...`);

      const promises = batch.map(email => sendEmail(email, false));
      const results = await Promise.all(promises);

      results.forEach((result, index) => {
        if (result.success) {
          successCount++;
          console.log(`  ✅ Sent to ${batch[index]}`);
        } else {
          failCount++;
          console.log(`  ❌ Failed to send to ${batch[index]}`);
        }
      });

      // Wait a bit between batches to avoid rate limiting
      if (i + batchSize < allRecipients.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Successfully sent: ${successCount}`);
    console.log(`   ❌ Failed: ${failCount}`);
    console.log(`   📧 Total: ${allRecipients.length}`);
  } else {
    console.log('Usage:');
    console.log('  npm run ts-node scripts/send-correction-email.ts test  - Send test email');
    console.log('  npm run ts-node scripts/send-correction-email.ts send  - Send to all recipients');
  }
}

main();
