import nodemailer from "nodemailer";

const isProduction = process.env.NODE_ENV === "production";

// Generate a booking reference from the booking ID
// Format: RB-XXXXXX (last 6 chars of ID, uppercase)
export const getBookingReference = (bookingId: string): string => {
  return `RB-${bookingId.slice(-6).toUpperCase()}`;
};

// Generate a payment reference from the booking ID
// Format: PAY-XXXXXX (last 6 chars of ID, uppercase)
export const getPaymentReference = (bookingId: string): string => {
  return `PAY-${bookingId.slice(-6).toUpperCase()}`;
};

export const buildAppEmailHtml = (title: string, bodyHtml: string): string => {
  const year = new Date().getFullYear();
  return `
    <div style="background:#f6f8fb;padding:24px 0;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden">
        <tr>
          <td style="padding:20px 24px;background:#0ea5e9;color:#ffffff;">
            <h1 style="margin:0;font-size:18px;">RedBoat</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:24px;">
            <h2 style="margin:0 0 12px;font-size:18px;color:#0f172a;">${title}</h2>
            <div style="margin:0 0 8px;color:#334155;font-size:14px;line-height:1.6;">
              ${bodyHtml}
            </div>
            <div style="margin-top:12px;color:#64748b;font-size:12px;">
              Standard check-in is 2:00 PM and check-out is 12:00 PM.
            </div>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 24px;background:#f8fafc;color:#64748b;font-size:12px;text-align:center;">
            © ${year} RedBoat
          </td>
        </tr>
      </table>
    </div>
  `;
};

export interface BookingSummaryDetails {
  reference?: string;
  paymentReference?: string;
  guestName?: string;
  room?: string;
  checkIn?: string;
  checkOut?: string;
  nights?: number | string;
  guests?: number | string;
  totalAmount?: string;
  bookingStatus?: string;
  paymentStatus?: string;
  paymentMethod?: string;
  paymentDate?: string;
}

export const buildBookingSummaryHtml = (details: BookingSummaryDetails): string => {
  const rows = [
    { label: "Booking Reference", value: details.reference },
    { label: "Payment Reference", value: details.paymentReference },
    { label: "Guest", value: details.guestName },
    { label: "Room", value: details.room },
    { label: "Check-in", value: details.checkIn },
    { label: "Check-out", value: details.checkOut },
    { label: "Nights", value: details.nights },
    { label: "Guests", value: details.guests },
    { label: "Total Amount", value: details.totalAmount },
    { label: "Booking Status", value: details.bookingStatus },
    { label: "Payment Status", value: details.paymentStatus },
    { label: "Payment Method", value: details.paymentMethod },
    { label: "Payment Date", value: details.paymentDate },
  ].filter((row) => row.value !== undefined && row.value !== null && String(row.value).trim() !== "");

  if (!rows.length) return "";

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:4px 8px;color:#64748b;white-space:nowrap;">${row.label}</td>
          <td style="padding:4px 8px;color:#0f172a;font-weight:500;">${row.value}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table style="width:100%;margin:12px 0;border-collapse:collapse;font-size:13px;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
};

export interface ChargeBreakdownDetails {
  baseAmount?: number;
  lateCheckInFee?: number;
  lateCheckOutFee?: number;
  extendedStayCharge?: number;
  additionalCharges?: number;
  totalCharges?: number;
  amountPaid?: number;
  balanceDue?: number;
}

export const buildChargeBreakdownHtml = (details: ChargeBreakdownDetails): string => {
  const formatMoney = (value?: number) => {
    if (value == null || Number.isNaN(value)) return "";
    return `₱${value.toFixed(2)}`;
  };

  const rows = [
    { label: "Base room amount", value: formatMoney(details.baseAmount) },
    { label: "Late check-in fee", value: formatMoney(details.lateCheckInFee) },
    { label: "Late check-out fee", value: formatMoney(details.lateCheckOutFee) },
    { label: "Extended stay charge", value: formatMoney(details.extendedStayCharge) },
    { label: "Additional charges", value: formatMoney(details.additionalCharges) },
    { label: "Total charges", value: formatMoney(details.totalCharges) },
    { label: "Amount paid", value: formatMoney(details.amountPaid) },
    { label: "Balance due", value: formatMoney(details.balanceDue) },
  ].filter((row) => row.value && row.value.trim() !== "");

  if (!rows.length) return "";

  const rowsHtml = rows
    .map(
      (row) => `
        <tr>
          <td style="padding:4px 8px;color:#64748b;white-space:nowrap;">${row.label}</td>
          <td style="padding:4px 8px;color:#0f172a;font-weight:500;">${row.value}</td>
        </tr>
      `
    )
    .join("");

  return `
    <table style="width:100%;margin:12px 0;border-collapse:collapse;font-size:13px;">
      <tbody>
        ${rowsHtml}
      </tbody>
    </table>
  `;
};

export const sendEmail = async (to: string, subject: string, html: string) => {
  // Use your Gmail or another SMTP provider
  const userRaw = process.env.EMAIL_USER;
  const passRaw = process.env.EMAIL_PASS;

  // Trim and sanitize common mistakes when copying Gmail App Passwords (often shown with spaces)
  const user = userRaw ? userRaw.trim() : "";
  let pass = passRaw ? passRaw.trim() : "";
  if (pass && /\s/.test(pass)) {
    pass = pass.replace(/\s+/g, "");
  }

  if (!user || !pass) {
    console.warn("Email credentials not configured. Skipping actual send and logging email instead.");
    console.log("[Email Preview] To:", to);
    console.log("[Email Preview] Subject:", subject);
    console.log("[Email Preview] HTML:", html);
    return;
  }

  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user, // your Gmail address
      pass, // your App Password (not your real Gmail password)
    },
  });

  const mailOptions = {
    from: `"RedBoat Hotel" <${user}>`,
    to,
    subject,
    html,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`📧 Email sent to ${to}`);
  } catch (error) {
    console.error("sendEmail error:", error);
    if (isProduction) {
      throw error;
    }
    console.warn("Email send failed in non-production environment. Logging email and continuing.");
    console.log("[Email Preview] To:", to);
    console.log("[Email Preview] Subject:", subject);
    console.log("[Email Preview] HTML:", html);
  }
};

export const sendAppEmail = async (to: string, subject: string, bodyHtml: string) => {
  const wrapped = buildAppEmailHtml(subject, bodyHtml);
  await sendEmail(to, subject, wrapped);
};
