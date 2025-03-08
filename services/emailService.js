const nodemailer = require("nodemailer");
require("dotenv").config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

const sendEmail = async (to, subject, html) => {
  try {
    const info = await transporter.sendMail({
      from: `"Transact" <${process.env.SMTP_FROM}>`,
      to,
      subject,
      html,
    });
    return info;
  } catch (error) {
    throw error;
  }
};

const sendInvitationRequestNotification = async (requestData) => {
  const subject = "New Invitation Code Request";
  const html = `
    <h2>New Invitation Code Request</h2>
    <p><strong>Email:</strong> ${requestData.email}</p>
    <p><strong>Telegram:</strong> ${requestData.telegram_handle}</p>
    <p><strong>WhatsApp:</strong> ${requestData.whatsapp}</p>
    <p><strong>Name:</strong> ${requestData.name || "Not provided"}</p>
    <p><strong>Country:</strong> ${requestData.country || "Not provided"}</p>
    <p><strong>Daily Volume:</strong> ${
      requestData.daily_volume || "Not provided"
    }</p>
    <p><strong>Referral Source:</strong> ${
      requestData.referral_source || "Not provided"
    }</p>
    <p>Please log in to the admin panel to approve or reject this request.</p>
  `;

  return sendEmail(process.env.ADMIN_EMAIL, subject, html);
};

const sendInvitationCodeEmail = async (userData, code) => {
  const subject = "Your Transact Invitation Code";
  const html = `
    <h2>Welcome to Transact!</h2>
    <p>Hello ${userData.name || userData.email},</p>
    <p>Your invitation code is: <strong>${code}</strong></p>
    <p>This code will expire in 30 days.</p>
    <p>Visit our platform and enter this code to access your features.</p>
    <p>Thank you for choosing Transact!</p>
  `;

  return sendEmail(userData.email, subject, html);
};

module.exports = {
  sendEmail,
  sendInvitationRequestNotification,
  sendInvitationCodeEmail,
};
