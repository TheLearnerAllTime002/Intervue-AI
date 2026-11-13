import { FiArrowLeft, FiExternalLink, FiGithub, FiHeart, FiUsers } from "react-icons/fi";
import { Link } from "react-router-dom";

const REPOSITORY_URL = "https://github.com/TheLearnerAllTime002/Intervue-AI";

function About() {
  return (
    <div className="min-h-screen bg-[var(--neo-paper)] text-black">
      <nav className="sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
          <Link to="/" className="text-sm font-extrabold sm:text-base">Intervue AI</Link>
          <Link to="/" className="flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-xs font-extrabold shadow-[2px_2px_0_#171717]"><FiArrowLeft /> Home</Link>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6 sm:py-16">
        <header className="border-2 border-black bg-sky-200 p-6 shadow-[6px_6px_0_#171717] sm:p-10">
          <span className="inline-flex items-center gap-2 border-2 border-black bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"><FiUsers /> About Us</span>
          <h1 className="mt-5 text-4xl font-black leading-tight sm:text-5xl">Interview prep is better when we build it together.</h1>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-sky-950 sm:text-base">Intervue AI is an open source project created to make interview preparation more practical and accessible. Practice with AI interviews, get useful feedback, and turn your goals into a clear plan. The project is built in the open, and contributors are welcome to help improve it, add ideas, fix bugs, and make it useful for more people.</p>
        </header>

        <section className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center border-2 border-black bg-white p-5 shadow-[3px_3px_0_#171717] sm:p-7">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-sky-900">Creator</p>
            <h2 className="mt-2 text-2xl font-black">Arjun Mitra</h2>
            <p className="mt-1 text-sm font-semibold text-black/65">GitHub: <a className="underline decoration-2 underline-offset-2" href="https://github.com/TheLearnerAllTime002" target="_blank" rel="noreferrer">@TheLearnerAllTime002</a></p>
          </div>
          <a href={REPOSITORY_URL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 border-2 border-black bg-yellow-300 px-4 py-3 text-sm font-black shadow-[3px_3px_0_#171717] transition-transform hover:-translate-y-0.5"><FiGithub size={18} /> View project & contribute <FiExternalLink size={14} /></a>
        </section>

        <p className="mt-5 flex items-center gap-2 text-xs font-bold text-black/60"><FiHeart className="text-sky-800" /> Contributions, feedback, and thoughtful ideas are welcome.</p>
      </main>
    </div>
  );
}

export default About;
