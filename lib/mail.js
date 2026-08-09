const nodemailer = require('nodemailer');

// Helper to create transport
const getTransporter = () => {
  console.log('[SMTP DEBUG] Initializing transporter...');
  console.log(`[SMTP DEBUG] SMTP_HOST: "${process.env.SMTP_HOST || ''}"`);
  console.log(`[SMTP DEBUG] SMTP_PORT: "${process.env.SMTP_PORT || ''}"`);
  console.log(`[SMTP DEBUG] SMTP_USER: "${process.env.SMTP_USER || ''}"`);
  console.log(`[SMTP DEBUG] SMTP_PASS: ${process.env.SMTP_PASS ? '********' : 'undefined/empty'}`);
  console.log(`[SMTP DEBUG] SMTP_SECURE: "${process.env.SMTP_SECURE || ''}"`);
  console.log(`[SMTP DEBUG] FROM_EMAIL: "${process.env.FROM_EMAIL || ''}"`);
  console.log(`[SMTP DEBUG] ADMIN_EMAIL: "${process.env.ADMIN_EMAIL || ''}"`);

  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_PORT ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.log('[SMTP DEBUG] Missing SMTP configurations, returning null transporter.');
    return null;
  }

  const secure = process.env.SMTP_SECURE === 'true' || process.env.SMTP_PORT === '465';
  console.log(`[SMTP DEBUG] Creating transport. secure = ${secure}`);
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10),
    secure,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

const sendEmailGracefully = async (mailOptions) => {
  const transporter = getTransporter();
  if (!transporter) {
    console.warn('[SMTP WARNING] SMTP is not configured in environment. Printing mail options to console:');
    console.log(JSON.stringify(mailOptions, null, 2));
    return false;
  }

  console.log(`[SMTP DEBUG] Attempting to send email to "${mailOptions.to}"...`);
  try {
    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || '"Caspian Connect" <noreply@caspianconnect.com>',
      ...mailOptions,
    });
    console.log(`[SMTP SUCCESS] Email sent successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('[SMTP ERROR] Failed to send email via SMTP:', error);
    console.log('Fallen back to logging mail options to console:');
    console.log(JSON.stringify(mailOptions, null, 2));
    return false;
  }
};

/**
 * Sends OTP password reset email to a user.
 */
const sendOtpEmail = async (email, otp) => {
  const mailOptions = {
    to: email,
    subject: 'Caspian Connect - Password Reset Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
            .header { background-color: #1f2937; padding: 30px; text-align: center; border-bottom: 4px solid #d97706; }
            .logo { font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
            .logo span { color: #d97706; }
            .content { padding: 40px; text-align: center; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #111827; }
            .text { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 30px; }
            .otp-container { background-color: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 20px; margin: 20px auto; display: inline-block; }
            .otp-code { font-size: 36px; font-weight: 800; color: #d97706; letter-spacing: 6px; margin: 0; }
            .expiry-note { font-size: 13px; color: #9ca3af; margin-top: 20px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CASPIAN<span>CONNECT</span></div>
            </div>
            <div class="content">
              <h2 class="title">Reset Your Password</h2>
              <p class="text">
                We received a request to reset your password for Caspian Connect B2B Portal.
                Please use the verification code below to complete the reset process.
              </p>
              <div class="otp-container">
                <h1 class="otp-code">${otp}</h1>
              </div>
              <p class="expiry-note">
                This verification code is valid for <strong>15 minutes</strong>.<br>
                If you did not request a password reset, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Caspian Connect B2B. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return sendEmailGracefully(mailOptions);
};

/**
 * Sends notification email to the admin regarding a new partner application.
 */
const sendAdminNotificationEmail = async (app) => {
  const adminEmail = process.env.ADMIN_EMAIL;
  if (!adminEmail) {
    console.warn('[SMTP WARNING] ADMIN_EMAIL is not set in environment. Admin notification skipped.');
    return false;
  }

  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:8080';
  const approvalLink = `${frontendUrl}/admin`;

  const mailOptions = {
    to: adminEmail,
    subject: `Caspian Connect Admin - New B2B Partner Registration Request [${app.company}]`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Registration Request</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
            .header { background-color: #1f2937; padding: 30px; text-align: center; border-bottom: 4px solid #d97706; }
            .logo { font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
            .logo span { color: #d97706; }
            .content { padding: 40px; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 15px; color: #111827; text-align: center; }
            .subtitle { font-size: 14px; color: #4b5563; text-align: center; margin-bottom: 30px; }
            .details-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
            .details-table th, .details-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
            .details-table th { background-color: #f9fafb; font-weight: 600; color: #374151; width: 35%; }
            .details-table td { color: #4b5563; }
            .btn-container { text-align: center; margin-top: 20px; }
            .btn { display: inline-block; padding: 12px 24px; background-color: #d97706; color: #ffffff !important; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 15px; box-shadow: 0 4px 6px -1px rgba(217, 119, 6, 0.2); }
            .btn:hover { background-color: #b45309; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CASPIAN<span>CONNECT</span></div>
            </div>
            <div class="content">
              <h2 class="title">New Partner Application</h2>
              <p class="subtitle">A new tour operator has submitted a B2B access request. Details below:</p>
              
              <table class="details-table">
                <tr>
                  <th>Company Name</th>
                  <td><strong>${app.company || '—'}</strong></td>
                </tr>
                <tr>
                  <th>Email</th>
                  <td>${app.email || '—'}</td>
                </tr>
                <tr>
                  <th>License Number</th>
                  <td>${app.license || '—'}</td>
                </tr>
                <tr>
                  <th>Website</th>
                  <td>${app.website ? `<a href="${app.website}" target="_blank" style="color: #d97706; text-decoration: underline;">${app.website}</a>` : '—'}</td>
                </tr>
                <tr>
                  <th>Instagram</th>
                  <td>${app.instagram ? `<a href="https://instagram.com/${app.instagram.replace('@', '')}" target="_blank" style="color: #d97706; text-decoration: underline;">${app.instagram}</a>` : '—'}</td>
                </tr>
                <tr>
                  <th>Submission Date</th>
                  <td>${new Date(app.submitted || Date.now()).toLocaleString()}</td>
                </tr>
              </table>

              <div class="btn-container">
                <a href="${approvalLink}" class="btn" target="_blank">Open Approval Queue</a>
              </div>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Caspian Connect B2B Admin Notification.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return sendEmailGracefully(mailOptions);
};

/**
 * Sends OTP email for B2B registration verification.
 */
const sendRegistrationOtpEmail = async (email, otp) => {
  const mailOptions = {
    to: email,
    subject: 'Caspian Connect - B2B Partner Registration Verification Code',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verification Code</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; color: #1f2937; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06); }
            .header { background-color: #1f2937; padding: 30px; text-align: center; border-bottom: 4px solid #d97706; }
            .logo { font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 2px; text-transform: uppercase; }
            .logo span { color: #d97706; }
            .content { padding: 40px; text-align: center; }
            .title { font-size: 22px; font-weight: 700; margin-bottom: 20px; color: #111827; }
            .text { font-size: 15px; color: #4b5563; line-height: 1.6; margin-bottom: 30px; }
            .otp-container { background-color: #fef3c7; border: 2px dashed #d97706; border-radius: 12px; padding: 20px; margin: 20px auto; display: inline-block; }
            .otp-code { font-size: 36px; font-weight: 800; color: #d97706; letter-spacing: 6px; margin: 0; }
            .expiry-note { font-size: 13px; color: #9ca3af; margin-top: 20px; }
            .footer { background-color: #f9fafb; padding: 20px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">CASPIAN<span>CONNECT</span></div>
            </div>
            <div class="content">
              <h2 class="title">Verify Your Email Address</h2>
              <p class="text">
                Thank you for applying to become a Silkbridge B2B Partner on Caspian Connect.
                To complete your registration application, please use the email verification code below.
              </p>
              <div class="otp-container">
                <h1 class="otp-code">${otp}</h1>
              </div>
              <p class="expiry-note">
                This verification code is valid for <strong>15 minutes</strong>.<br>
                If you did not initiate this registration, you can safely ignore this email.
              </p>
            </div>
            <div class="footer">
              <p>&copy; ${new Date().getFullYear()} Caspian Connect B2B. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  };

  return sendEmailGracefully(mailOptions);
};

module.exports = {
  sendOtpEmail,
  sendRegistrationOtpEmail,
  sendAdminNotificationEmail,
};
