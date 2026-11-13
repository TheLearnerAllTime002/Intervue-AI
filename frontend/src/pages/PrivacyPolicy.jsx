import { FiArrowLeft, FiDatabase, FiLock, FiMail, FiRefreshCw, FiShield, FiUser } from "react-icons/fi";
import { Link } from "react-router-dom";

const sections = [
  {
    icon: FiDatabase,
    title: "Information used by Intervue AI",
    body: "Depending on the features you use, this can include account details, resume and job information you provide, interview questions and answers, saved question banks, and messages submitted through Contact Us. The service also receives basic technical information needed to keep the app working and secure.",
  },
  {
    icon: FiRefreshCw,
    title: "How information is used",
    body: "Intervue AI uses this information to provide interview practice, generate questions and feedback, save your progress and materials, respond to support requests, and maintain the security and reliability of the service.",
  },
  {
    icon: FiShield,
    title: "AI features and service providers",
    body: "When you use AI interview features, the relevant role details, resume information, questions, or answers may be processed by the AI service provider used to generate questions or feedback. Intervue AI also relies on third-party services for functions such as sign-in and message delivery. Those providers process information under their own terms and privacy practices.",
  },
  {
    icon: FiLock,
    title: "Storage and security",
    body: "Information is handled by the app and its service providers to deliver the features you request. Reasonable safeguards are used to protect it, but no internet service can guarantee absolute security. Avoid submitting sensitive personal information that is not needed for interview preparation.",
  },
  {
    icon: FiUser,
    title: "Your choices and requests",
    body: "You can choose what information to enter and which features to use. To ask a question about your information, or request access, correction, or deletion, contact us through the Contact Us page. We may need to verify your account before acting on a request.",
  },
];

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-[var(--neo-paper)] text-black">
      <nav className="sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-extrabold sm:text-base">Intervue AI</Link>
          <Link to="/" className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold shadow-[2px_2px_0_#171717]"><FiArrowLeft /> Home</Link>
        </div>
      </nav>
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="mb-8 border-2 border-black bg-sky-200 p-6 shadow-[6px_6px_0_#171717] sm:p-9">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"><FiShield /> Privacy</span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Privacy Policy</h1>
          <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-sky-950">This page explains what information Intervue AI uses and why when you use the app.</p>
        </header>

        <div className="space-y-4">
          {sections.map(({ icon: Icon, title, body }) => (
            <section key={title} className="border-2 border-black bg-white p-5 shadow-[3px_3px_0_#171717] sm:p-6">
              <h2 className="flex items-center gap-3 text-lg font-black"><span className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-yellow-300"><Icon size={18} /></span>{title}</h2>
              <p className="mt-4 text-sm font-medium leading-7 text-black/75">{body}</p>
            </section>
          ))}
        </div>

        <section className="mt-4 border-2 border-black bg-yellow-100 p-5 sm:p-6">
          <h2 className="flex items-center gap-3 text-lg font-black"><FiMail /> Contact about privacy</h2>
          <p className="mt-3 text-sm font-medium leading-7 text-black/75">For privacy questions or requests, use the <Link to="/contact" className="font-black underline">Contact Us page</Link> and include enough detail for us to understand your request.</p>
        </section>
        <p className="mt-6 text-xs font-semibold leading-6 text-black/55">This policy may be updated as Intervue AI changes. The current version will be available on this page.</p>
      </main>
    </div>
  );
}

export default PrivacyPolicy;
