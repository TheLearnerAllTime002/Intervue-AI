import { useState } from "react";
import { FiBriefcase, FiCheck, FiCopy, FiFileText, FiTarget, FiZap } from "react-icons/fi";
import api from "../utils/axios";
import { Skeleton, useDelayedLoading } from "./Skeleton";

function SkillList({ title, items, icon: Icon, emptyText, tone }) {
  return (
    <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0_#171717]">
      <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-black">
        <Icon className={tone} /> {title}
      </h4>
      {items?.length ? (
        <ul className="flex flex-wrap gap-2">
          {items.map((item, index) => <li key={`${item}-${index}`} className="border border-black bg-sky-100 px-2 py-1 text-xs font-bold text-sky-950">{item}</li>)}
        </ul>
      ) : <p className="text-xs font-semibold text-black/65">{emptyText}</p>}
    </div>
  );
}

export default function JobMatch() {
  const [jobDescription, setJobDescription] = useState("");
  const [match, setMatch] = useState(null);
  const [materials, setMaterials] = useState(null);
  const [materialsLoading, setMaterialsLoading] = useState(false);
  const [copied, setCopied] = useState("");
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const showMatchSkeleton = useDelayedLoading(loading);
  const showMaterialsSkeleton = useDelayedLoading(materialsLoading);

  const runMatch = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMatch(null);
    try {
      const response = await api.post("/api/resume/match-job", { jobDescription });
      setMatch(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not match your resume right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateMaterials = async () => {
    setMaterialsLoading(true);
    setError("");
    setMaterials(null);
    try {
      const response = await api.post("/api/resume/job-materials", { jobDescription, company, role });
      setMaterials(response.data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not generate your tailored resume and cover letter.");
    } finally {
      setMaterialsLoading(false);
    }
  };

  const copyText = async (label, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1800);
    } catch {
      setError("Clipboard access is unavailable in this browser.");
    }
  };

  return (
    <section className="space-y-4 border-2 border-black bg-sky-100 p-4 shadow-[5px_5px_0_#171717] sm:p-5" aria-labelledby="job-match-heading">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-yellow-300 text-black"><FiBriefcase size={18} /></div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-950">Target a role</p>
          <h3 id="job-match-heading" className="text-lg font-black text-black">Resume-to-job match</h3>
          <p className="mt-1 text-xs font-semibold text-sky-950">Compare your saved resume with a job description to see your fit and skill gaps.</p>
        </div>
      </div>

      <form onSubmit={runMatch} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-extrabold text-black" htmlFor="job-role">Role title <span className="font-medium text-black/60">(optional)</span>
            <input id="job-role" value={role} onChange={(event) => setRole(event.target.value)} maxLength={160} placeholder="e.g. Product Designer" className="mt-1 w-full p-2.5 text-sm font-medium" />
          </label>
          <label className="block text-xs font-extrabold text-black" htmlFor="job-company">Company <span className="font-medium text-black/60">(optional)</span>
            <input id="job-company" value={company} onChange={(event) => setCompany(event.target.value)} maxLength={160} placeholder="e.g. Acme Inc." className="mt-1 w-full p-2.5 text-sm font-medium" />
          </label>
        </div>
        <label className="block text-xs font-extrabold text-black" htmlFor="job-description">Job description</label>
        <textarea
          id="job-description"
          value={jobDescription}
          onChange={(event) => setJobDescription(event.target.value)}
          rows={6}
          maxLength={18000}
          placeholder="Paste the job description, including responsibilities and required skills..."
          className="w-full resize-y bg-white p-3 text-sm text-black"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-[10px] font-semibold text-sky-950">{jobDescription.length.toLocaleString()} / 18,000 characters</span>
          <button type="submit" disabled={loading || jobDescription.trim().length < 40} className="neo-yellow-surface px-4 py-2 text-xs font-extrabold">
            {loading ? "Matching..." : "Match my resume"}
          </button>
        </div>
      </form>

      {showMatchSkeleton && <div aria-label="Matching resume to job" aria-busy="true" className="space-y-3 border-t-2 border-black pt-4"><div className="flex gap-3 border-2 border-black bg-white p-4"><Skeleton className="h-16 w-16 shrink-0" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /></div></div><div className="grid gap-3 md:grid-cols-2"><Skeleton className="h-24" /><Skeleton className="h-24" /></div></div>}

      {error && <p role="alert" className="border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-950">{error}</p>}

      {match && (
        <div aria-live="polite" className="space-y-4 border-t-2 border-black pt-4">
          <div className="flex flex-col gap-3 border-2 border-black bg-yellow-200 p-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center border-2 border-black bg-white shadow-[3px_3px_0_#171717]">
              <span className="text-2xl font-black text-black">{match.fitScore}</span>
              <span className="text-[9px] font-extrabold uppercase text-sky-950">Fit / 100</span>
            </div>
            <p className="text-sm font-semibold leading-relaxed text-black">{match.summary}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <SkillList title="Skills supported by your resume" items={match.matchedSkills} icon={FiCheck} emptyText="No direct matches were identified." tone="text-sky-900" />
            <SkillList title="Skills not evidenced yet" items={match.missingSkills} icon={FiTarget} emptyText="No major skill gaps were identified." tone="text-amber-800" />
          </div>

          <div className="border-2 border-black bg-white p-4 shadow-[3px_3px_0_#171717]">
            <h4 className="mb-3 flex items-center gap-2 text-sm font-black text-black"><FiZap className="text-sky-900" /> Ways to improve your match</h4>
            {match.recommendations?.length ? <ul className="space-y-2">{match.recommendations.map((item, index) => <li key={`${item}-${index}`} className="flex gap-2 text-xs font-semibold text-black"><span className="font-black text-sky-900">{index + 1}.</span>{item}</li>)}</ul> : <p className="text-xs font-semibold text-black/65">No recommendations available.</p>}
          </div>
          <p className="text-[10px] font-medium text-black/65">This score estimates resume alignment with the job description. It is not a hiring prediction.</p>
          <div className="flex flex-col gap-3 border-t-2 border-black pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div><h4 className="text-sm font-black text-black">Create application materials</h4><p className="mt-1 text-xs font-semibold text-sky-950">Generate a role-focused resume draft and cover letter from your saved resume.</p></div>
            <button type="button" onClick={generateMaterials} disabled={materialsLoading} className="neo-yellow-surface flex shrink-0 items-center justify-center gap-2 px-4 py-2 text-xs font-extrabold">
              <FiFileText />{materialsLoading ? "Generating..." : "Tailor resume + cover letter"}
            </button>
          </div>
        </div>
      )}

      {showMaterialsSkeleton && <div aria-label="Generating application materials" aria-busy="true" className="grid gap-3 border-t-2 border-black pt-4 xl:grid-cols-2"><div className="space-y-3 border-2 border-black bg-white p-4"><Skeleton className="h-5 w-2/3" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-5/6" /><Skeleton className="h-3 w-3/4" /></div><div className="space-y-3 border-2 border-black bg-white p-4"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-4/5" /><Skeleton className="h-3 w-full" /><Skeleton className="h-3 w-2/3" /></div></div>}

      {materials && (
        <div className="grid gap-3 border-t-2 border-black pt-4 xl:grid-cols-2" aria-live="polite">
          {[
            ["tailored-resume", "Tailored resume draft", materials.resumeDraft],
            ["cover-letter", "Cover letter", materials.coverLetter],
          ].map(([key, title, text]) => (
            <section key={key} className="min-w-0 border-2 border-black bg-white shadow-[3px_3px_0_#171717]">
              <div className="flex items-center justify-between gap-2 border-b-2 border-black bg-yellow-100 px-3 py-2">
                <h4 className="text-sm font-black text-black">{title}</h4>
                <button type="button" onClick={() => copyText(key, text)} className="flex shrink-0 items-center gap-1.5 px-2 py-1 text-[10px] font-extrabold"><FiCopy />{copied === key ? "Copied" : "Copy"}</button>
              </div>
              <pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words p-3 font-sans text-xs leading-relaxed text-black">{text}</pre>
            </section>
          ))}
          <p className="text-[10px] font-medium text-black/65 xl:col-span-2">Review and correct all generated details before using these drafts. The AI is instructed to use only facts found in your resume.</p>
        </div>
      )}
    </section>
  );
}
