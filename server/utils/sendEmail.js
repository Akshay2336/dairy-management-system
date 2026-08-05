const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async (options) => {
  const { data, error } = await resend.emails.send({
    from: process.env.EMAIL_FROM,
    to: [options.email],
    subject: options.subject,
    html: options.message,
  });

  if (error) {
    console.error("Resend Error:", error);
    throw new Error(error.message || "Email sending failed");
  }

  console.log("✅ Email sent successfully:", data);

  return data;
};

module.exports = sendEmail;
