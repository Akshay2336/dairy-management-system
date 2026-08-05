const sendEmail = async (options) => {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [options.email],
        subject: options.subject,
        html: options.message,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("❌ Resend API Error:", data);
      throw new Error(data.message || "Failed to send email");
    }

    console.log("✅ Email sent successfully:", data);

    return data;
  } catch (error) {
    console.error("❌ Email sending error:", error);
    throw error;
  }
};

module.exports = sendEmail;
