import { useState } from "react";
import { FiArrowLeft, FiCheckCircle, FiMail, FiSend } from "react-icons/fi";
import { Link } from "react-router-dom";
import api from "../utils/axios";

const EMPTY_FORM = { name: "", email: "", subject: "", message: "", website: "" };

function Contact() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const update = (field) => (event) => {
    setSent(false);
    setForm((current) => ({ ...current, [field]: event.target.value }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      await api.post("/api/contact", form);
      setForm(EMPTY_FORM);
      setSent(true);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Your message could not be sent. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--neo-paper)] text-black">
      <nav className="sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-1.5 text-sm font-extrabold sm:text-base">Intervue AI</Link>
          <Link to="/" className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold shadow-[2px_2px_0_#171717]"><FiArrowLeft /> Home</Link>
        </div>
      </nav>

      <main className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
        <section className="space-y-5">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-yellow-300 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-[3px_3px_0_#171717]"><FiMail /> Contact Us</span>
          <h1 className="text-4xl font-black leading-tight sm:text-5xl">We’d like to hear from you.</h1>
          <p className="max-w-lg text-sm font-semibold leading-7 text-sky-950">Have a question, found a bug, or want to share feedback about Intervue AI? Send a message and we’ll get back to you.</p>
          <div className="border-l-4 border-sky-800 bg-sky-100 p-4 text-xs font-semibold leading-6 text-sky-950">Your message goes to the Intervue AI team. Your email address is used only so we can reply.</div>
        </section>

        <form onSubmit={submit} className="space-y-4 border-2 border-black bg-sky-100 p-5 shadow-[6px_6px_0_#171717] sm:p-7">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-2 text-xs font-extrabold" htmlFor="contact-name">Name
              <input id="contact-name" required minLength={2} maxLength={120} autoComplete="name" value={form.name} onChange={update("name")} placeholder="Your name" className="p-3 text-sm font-medium" />
            </label>
            <label className="flex flex-col gap-2 text-xs font-extrabold" htmlFor="contact-email">Email
              <input id="contact-email" type="email" required maxLength={254} autoComplete="email" value={form.email} onChange={update("email")} placeholder="you@example.com" className="p-3 text-sm font-medium" />
            </label>
          </div>
          <label className="flex flex-col gap-2 text-xs font-extrabold" htmlFor="contact-subject">Subject
            <input id="contact-subject" required minLength={3} maxLength={180} value={form.subject} onChange={update("subject")} placeholder="How can we help?" className="p-3 text-sm font-medium" />
          </label>
          <label className="flex flex-col gap-2 text-xs font-extrabold" htmlFor="contact-message">Message
            <textarea id="contact-message" required minLength={10} maxLength={6000} rows={7} value={form.message} onChange={update("message")} placeholder="Write your message here..." className="resize-y p-3 text-sm font-medium" />
            <span className="text-right text-[10px] font-semibold text-sky-950">{form.message.length.toLocaleString()} / 6,000</span>
          </label>

          <div className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label htmlFor="contact-website">Leave this field empty</label>
            <input id="contact-website" tabIndex={-1} autoComplete="off" value={form.website} onChange={update("website")} />
          </div>

          {error && <p role="alert" className="border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-950">{error}</p>}
          {sent && <p role="status" className="flex items-center gap-2 border-2 border-black bg-green-100 p-3 text-sm font-bold text-green-950"><FiCheckCircle /> Message sent. Thanks for reaching out.</p>}

          <button type="submit" disabled={sending} className="neo-yellow-surface flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-black">
            <FiSend />{sending ? "Sending..." : "Send message"}
          </button>
        </form>
      </main>
    </div>
  );
}

export default Contact;
