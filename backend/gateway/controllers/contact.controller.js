const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const contactRequests = new Map();

export const sendContactMessage = async (req, res) => {
  const { name, email, subject, message, website = "" } = req.body ?? {};

  // Quietly accept bot submissions without sending mail.
  if (typeof website === "string" && website.trim()) {
    return res.status(200).json({ success: true, message: "Your message was sent." });
  }

  if (
    typeof name !== "string" || name.trim().length < 2 || name.length > 120 ||
    typeof email !== "string" || email.length > 254 || !emailPattern.test(email.trim()) ||
    typeof subject !== "string" || subject.trim().length < 3 || subject.length > 180 ||
    typeof message !== "string" || message.trim().length < 10 || message.length > 6000
  ) {
    return res.status(400).json({ success: false, message: "Enter a valid name, email, subject, and message." });
  }

  const { EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY } = process.env;
  if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY || !EMAILJS_PRIVATE_KEY) {
    return res.status(503).json({ success: false, message: "Contact email is not fully configured yet. Please try again later." });
  }

  const now = Date.now();
  const key = req.ip || req.socket.remoteAddress || "unknown";
  const recent = (contactRequests.get(key) || []).filter((timestamp) => now - timestamp < 60_000);
  if (recent.length >= 5) {
    contactRequests.set(key, recent);
    return res.status(429).json({ success: false, message: "Too many messages. Please wait one minute before trying again." });
  }
  recent.push(now);
  contactRequests.set(key, recent);

  try {
    const response = await fetch("https://api.emailjs.com/api/v1.0/email/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: EMAILJS_SERVICE_ID,
        template_id: EMAILJS_TEMPLATE_ID,
        user_id: EMAILJS_PUBLIC_KEY,
        accessToken: EMAILJS_PRIVATE_KEY,
        template_params: {
          from_name: name.trim(),
          from_email: email.trim(),
          reply_to: email.trim(),
          subject: subject.trim(),
          message: message.trim(),
          sent_at: new Date().toISOString(),
        },
      }),
      signal: AbortSignal.timeout(12_000),
    });

    if (!response.ok) {
      const detail = (await response.text()).slice(0, 500);
      console.error("EmailJS contact send failed:", response.status, detail);
      const diagnostic = detail.replace(/\s+/g, " ").trim().slice(0, 240);
      return res.status(502).json({
        success: false,
        message: diagnostic
          ? `Email delivery failed (${response.status}): ${diagnostic}`
          : "Email delivery failed. Please check the gateway log for the EmailJS response.",
      });
    }
    return res.status(200).json({ success: true, message: "Your message was sent. Thanks for reaching out." });
  } catch (error) {
    console.error("EmailJS contact request failed:", error.message);
    return res.status(502).json({ success: false, message: "Could not send your message right now. Please try again shortly." });
  }
};
