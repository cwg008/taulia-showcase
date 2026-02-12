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

const sendAccessApproved = async (email, name, prototypeName, viewerUrl) => {
  try {
    // If SMTP is not configured, just log the approval
    if (!process.env.SMTP_HOST) {
      console.log(`Access approved email for ${email}: Access granted to ${prototypeName}. Viewer URL: ${viewerUrl}`);
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
      subject: `Access Approved: ${prototypeName}`,
      html: `
        <h2>Access Approved</h2>
        <p>Hi ${name},</p>
        <p>Your access to the <strong>${prototypeName}</strong> prototype has been approved.</p>
        <p>You can now view the prototype by clicking the link below:</p>
        <p><a href="${viewerUrl}">View Prototype</a></p>
        <p>If you have any questions, please contact the prototype team.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send access approved email:', error.message);
    return false;
  }
};

const sendAccessDenied = async (email, name, prototypeName) => {
  try {
    // If SMTP is not configured, just log the denial
    if (!process.env.SMTP_HOST) {
      console.log(`Access denied email for ${email}: Access denied to ${prototypeName}`);
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
      subject: `Access Request: ${prototypeName}`,
      html: `
        <h2>Access Request Update</h2>
        <p>Hi ${name},</p>
        <p>Your access request for the <strong>${prototypeName}</strong> prototype has been denied.</p>
        <p>If you believe this is in error or would like to discuss this decision, please contact the prototype team.</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Failed to send access denied email:', error.message);
    return false;
  }
};

module.exports = { sendInviteEmail, sendAccessApproved, sendAccessDenied };
