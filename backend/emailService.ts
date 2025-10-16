import nodemailer from "nodemailer";

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Use your Gmail or another SMTP provider
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER, // your Gmail address
      pass: process.env.EMAIL_PASS, // your App Password (not your real Gmail password)
    },
  });

  const mailOptions = {
    from: `"WebProj" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`📧 Email sent to ${to}`);
};
