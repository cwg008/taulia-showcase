const nodemailer = require('nodemailer');

const sendInviteEmail = async (email, inviteUrl) => {
  try {
    // If SMTP is not configured, just log the URL
    if (!process.env.SMTP_HOST) {
      console.log(`Invite URL for ${email}: ${inviteUrl}`);
      return true;
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const mailOptions = {
      from: process.env.SMTP_FROM || 'noreply@taulia.com',
      to: email,
      subject: 'You are invited to Taulia Prototype Showcase',
      html: `
        <h2>Welcome to Taulia Prototype Showcase</h2>
        <p>You have been invited to join Taulia Prototype Showcase.</p>
        <p>Click the link below to set up your account:</p>
        <p><a href="${inviteUrl}">${inviteUrl}</a></p>
        <p>This link will expire in 7 days.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send invite email:', error.message);
    return false;
  }
};

module.exports = { sendInviteEmail };
