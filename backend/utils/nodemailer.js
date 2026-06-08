const nodemailer = require('nodemailer');
const Settings = require('../models/Settings');

// Create transporter using environment variables
const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || '',
    },
  });
};

const sendEmail = async ({ to, subject, text, html }) => {
  const adminEmail = to || process.env.SMTP_USER || 'admin@society.com';
  
  // If SMTP user is placeholder or empty, just log to console
  if (!process.env.SMTP_USER || process.env.SMTP_USER === 'your_smtp_username') {
    console.log('\n--- EMAIL NOTIFICATION LOG (SMTP NOT CONFIGED) ---');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log('--------------------------------------------------\n');
    return true;
  }

  try {
    const transporter = getTransporter();
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"SPMS Alerts" <noreply@society.com>',
      to: adminEmail,
      subject,
      text,
      html
    });
    console.log(`Email sent: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    // Log to console anyway as a fallback
    console.log('\n--- EMAIL NOTIFICATION LOG (SMTP ERROR FALLBACK) ---');
    console.log(`To: ${adminEmail}`);
    console.log(`Subject: ${subject}`);
    console.log(`Content: ${text}`);
    console.log('--------------------------------------------------\n');
    return false;
  }
};

const sendOverstayEmail = async (plate, buildingNumber, flatNumber, entryTime, overstayMinutes, adminEmail) => {
  const formattedTime = new Date(entryTime).toLocaleString();
  const subject = `⚠️ Overstay Alert: Vehicle ${plate} Exceeded Limit`;
  const text = `Warning: Vehicle ${plate} parked at building ${buildingNumber} flat ${flatNumber} has been inside since ${formattedTime}. It has exceeded the maximum parking limit of ${overstayMinutes} minutes.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #dc2626; margin-top: 0;">⚠️ Parking Overstay Alert</h2>
      <p>A vehicle has exceeded the allowed parking duration limit.</p>
      <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Plate Number</td>
          <td style="padding: 8px; color: #1e293b; border: 1px solid #e2e8f0;">${plate}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Building Number</td>
          <td style="padding: 8px; color: #1e293b; border: 1px solid #e2e8f0;">Building ${buildingNumber}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Flat Number</td>
          <td style="padding: 8px; color: #1e293b; border: 1px solid #e2e8f0;">${flatNumber}</td>
        </tr>
        <tr style="background-color: #f8fafc;">
          <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Entry Time</td>
          <td style="padding: 8px; color: #1e293b; border: 1px solid #e2e8f0;">${formattedTime}</td>
        </tr>
        <tr>
          <td style="padding: 8px; font-weight: bold; border: 1px solid #e2e8f0;">Allowed Limit</td>
          <td style="padding: 8px; color: #1e293b; border: 1px solid #e2e8f0;">${overstayMinutes} minutes</td>
        </tr>
      </table>
      <p style="margin-top: 20px; color: #64748b; font-size: 14px;">This is an automated warning sent from the Society Parking Management System (SPMS).</p>
    </div>
  `;
  return await sendEmail({ to: adminEmail, subject, text, html });
};

const sendFullAlertEmail = async (count, limit, adminEmail) => {
  const subject = `🚨 CRITICAL Alert: Society Parking is FULL`;
  const text = `Alert: The parking lot has reached its overflow limit. Current vehicle count: ${count}. Capacity limit: ${limit}. No more vehicles should be allowed entry.`;
  const html = `
    <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
      <h2 style="color: #e11d48; margin-top: 0;">🚨 Critical Capacity Alert: FULL</h2>
      <p>The society parking has reached or exceeded its designated overflow limit.</p>
      <div style="background-color: #fff1f2; color: #9f1239; padding: 15px; border-radius: 6px; margin: 15px 0; font-weight: bold; font-size: 18px; text-align: center;">
        Current Count: ${count} / Limit: ${limit}
      </div>
      <p>Please advise security guards to stop incoming vehicles and enforce parking regulations.</p>
      <p style="margin-top: 20px; color: #64748b; font-size: 14px;">This is an automated warning sent from the Society Parking Management System (SPMS).</p>
    </div>
  `;
  return await sendEmail({ to: adminEmail, subject, text, html });
};

module.exports = {
  sendEmail,
  sendOverstayEmail,
  sendFullAlertEmail
};
