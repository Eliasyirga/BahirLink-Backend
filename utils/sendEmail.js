const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"BahirLink" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });

    console.log(`Email sent: ${info.messageId} to ${to}`);
  } catch (err) {
    console.error("Failed to send email:", err);
    throw err; // Ensure your controller catches this
  }
};

module.exports = sendEmail;
