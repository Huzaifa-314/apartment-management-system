import nodemailer from 'nodemailer';

let transporter = null;

export function initMailer(config) {
  if (!config.host || !config.user) {
    console.warn('SMTP not configured — emails will be skipped');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port || 587,
    secure: config.secure === true,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  });
  return transporter;
}

export async function sendMail({ to, subject, text, html }) {
  if (!transporter) {
    console.log('[email skipped]', subject, '→', to);
    return { skipped: true };
  }
  const from = process.env.SMTP_FROM || process.env.SMTP_USER;
  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html: html || text,
  });
}

export async function sendPaymentReminderEmail(tenantEmail, tenantName, amount, dueDateStr) {
  return sendMail({
    to: tenantEmail,
    subject: 'Rent payment reminder',
    text: `Hello ${tenantName},\n\nThis is a reminder that your rent payment of ${amount} is due on ${dueDateStr}.\n\nThank you.`,
  });
}

export async function sendComplaintUpdateEmail(tenantEmail, tenantName, title, status) {
  return sendMail({
    to: tenantEmail,
    subject: `Complaint update: ${title}`,
    text: `Hello ${tenantName},\n\nYour complaint "${title}" status has been updated to: ${status}.\n\nThank you.`,
  });
}
