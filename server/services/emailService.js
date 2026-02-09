const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
}

async function sendInvite(email, inviteUrl, name) {
  const transport = getTransporter();
  if (!transport) {
    console.log(`[Email] SMTP not configured. Invite URL for ${email}: ${inviteUrl}`);
    return;
  }

  await transport.sendMail({
    from: process.env.SMTP_FROM || 'noreply@taulia.com',
    to: email,
    subject: 'You\'ve been invited to Taulia Prototype Showcase',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background: #0066CC; padding: 24px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Taulia</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0;">Prototype Showcase</p>
        </div>
        <div style="padding: 32px; background: #fff;">
          <p>Hi${name ? ` ${name}` : ''},</p>
          <p>You've been invited to join the Taulia Prototype Showcase as an admin.</p>
          <p style="text-align: center; margin: 32px 0;">
            <a href="${inviteUrl}" style="background: #0066CC; color: white; padding: 12px 32px; text-decoration: none; border-radius: 6px; display: inline-block;">Accept Invitation</a>
          </p>
          <p style="color: #666; font-size: 14px;">This invitation expires in 48 hours.</p>
        </div>
      </div>
    `,
  });
}

module.exports = { sendInvite };
