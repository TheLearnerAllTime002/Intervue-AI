import { useCallback, useEffect, useState } from "react";
import { FiBriefcase, FiCalendar, FiExternalLink, FiPlus, FiTrash2 } from "react-icons/fi";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axios";

const STAGES = [
  { value: "saved", label: "Saved" },
  { value: "applied", label: "Applied" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
];

const initialForm = { company: "", role: "", stage: "saved", deadline: "", jobUrl: "", notes: "" };

function safeJobUrl(value) {
  try {
    const url = new URL(value);
    return ["https:", "http:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function Applications() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [pendingId, setPendingId] = useState("");
  const [error, setError] = useState("");

  const loadApplications = useCallback(async () => {
    try {
      const response = await api.get("/api/resume/applications");
      setApplications(response.data.data || []);
      setError("");
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not load your application tracker.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadApplications(); }, [loadApplications]);

  const updateForm = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  const addApplication = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      const response = await api.post("/api/resume/applications", form);
      setApplications((current) => [response.data.data, ...current]);
      setForm(initialForm);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not save this application.");
    } finally {
      setSaving(false);
    }
  };

  const changeStage = async (application, stage) => {
    setPendingId(application._id);
    setError("");
    try {
      const response = await api.patch(`/api/resume/applications/${application._id}`, { stage });
      setApplications((current) => current.map((item) => item._id === application._id ? response.data.data : item));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not update the application stage.");
    } finally {
      setPendingId("");
    }
  };

  const deleteApplication = async (application) => {
    if (!window.confirm(`Remove the ${application.role} application at ${application.company}?`)) return;
    setPendingId(application._id);
    setError("");
    try {
      await api.delete(`/api/resume/applications/${application._id}`);
      setApplications((current) => current.filter((item) => item._id !== application._id));
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Could not remove this application.");
    } finally {
      setPendingId("");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--neo-paper)] text-black">
      <motion.nav
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="sticky inset-x-0 top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]"
      >
        <div className="mx-auto flex h-14 max-w-7xl items-center px-4 sm:px-6">
          <button type="button" onClick={() => navigate("/dashboard")} className="resume-home-button flex items-center gap-1.5 p-0">
            <span className="text-sm font-extrabold text-[#0A0A0A] sm:text-base">Intervue AI</span>
            <span className="hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block">APPLICATION TRACKER</span>
          </button>
        </div>
      </motion.nav>

    <main className="px-4 py-6 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b-2 border-black pb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-sky-900">Job search</p>
            <h1 className="mt-2 text-3xl font-black sm:text-4xl">Application tracker</h1>
            <p className="mt-2 max-w-2xl text-sm font-semibold text-black/65">Keep roles, deadlines, links, notes, and interview stages organized in one place.</p>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.5fr)]">
          <form onSubmit={addApplication} className="space-y-4 border-2 border-black bg-sky-100 p-4 shadow-[5px_5px_0_#171717] sm:p-5">
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center border-2 border-black bg-yellow-300"><FiPlus /></span>
              <h2 className="text-lg font-black">Add an application</h2>
            </div>
            <label className="block space-y-1 text-xs font-extrabold">Company<input required maxLength={160} value={form.company} onChange={updateForm("company")} placeholder="Company name" className="w-full p-2.5 text-sm" /></label>
            <label className="block space-y-1 text-xs font-extrabold">Role<input required maxLength={160} value={form.role} onChange={updateForm("role")} placeholder="Job title" className="w-full p-2.5 text-sm" /></label>
            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1 text-xs font-extrabold">Stage<select value={form.stage} onChange={updateForm("stage")} className="w-full p-2.5 text-sm">{STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select></label>
              <label className="block space-y-1 text-xs font-extrabold">Deadline<input type="date" value={form.deadline} onChange={updateForm("deadline")} className="w-full p-2 text-sm" /></label>
            </div>
            <label className="block space-y-1 text-xs font-extrabold">Job link <span className="font-medium text-black/60">(optional)</span><input type="url" maxLength={1000} value={form.jobUrl} onChange={updateForm("jobUrl")} placeholder="https://..." className="w-full p-2.5 text-sm" /></label>
            <label className="block text-xs font-extrabold">Notes <span className="font-medium text-black/60">(optional)</span><textarea maxLength={2000} rows={3} value={form.notes} onChange={updateForm("notes")} placeholder="Contact, next steps, or interview details" className="application-notes-field mt-2 w-full resize-y p-2.5 text-sm" /></label>
            <button type="submit" disabled={saving || !form.company.trim() || !form.role.trim()} className="neo-yellow-surface w-full px-4 py-2.5 text-sm font-black">{saving ? "Saving..." : "Save application"}</button>
          </form>

          <section className="space-y-4" aria-labelledby="saved-applications-heading">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-[10px] font-black uppercase tracking-widest text-sky-900">Your job search</p><h2 id="saved-applications-heading" className="text-xl font-black">Saved applications <span className="text-sm text-black/55">({applications.length})</span></h2></div>
            </div>

            {error && <p role="alert" className="border-2 border-black bg-red-100 p-3 text-sm font-bold text-red-950">{error}</p>}
            {loading ? <p className="border-2 border-black bg-white p-6 text-sm font-bold text-black/65">Loading your applications...</p> : applications.length === 0 ? (
              <div className="border-2 border-dashed border-black bg-white p-8 text-center shadow-[3px_3px_0_#171717]"><FiBriefcase className="mx-auto mb-3 text-sky-900" size={24} /><p className="font-black">No applications saved yet</p><p className="mt-1 text-xs font-semibold text-black/60">Add a role to start tracking your job search.</p></div>
            ) : applications.map((application) => {
              const jobUrl = safeJobUrl(application.jobUrl || "");
              return (
                <article key={application._id} className="space-y-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#171717]">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0"><h3 className="break-words text-lg font-black">{application.role}</h3><p className="text-sm font-bold text-sky-950">{application.company}</p></div>
                    <div className="flex items-center gap-2">
                      <select aria-label={`Stage for ${application.role} at ${application.company}`} value={application.stage} disabled={pendingId === application._id} onChange={(event) => changeStage(application, event.target.value)} className="max-w-40 p-2 text-xs font-extrabold">{STAGES.map((stage) => <option key={stage.value} value={stage.value}>{stage.label}</option>)}</select>
                      <button type="button" aria-label={`Remove ${application.role} at ${application.company}`} title="Remove application" disabled={pendingId === application._id} onClick={() => deleteApplication(application)} className="flex h-9 w-9 items-center justify-center bg-red-100 text-red-950"><FiTrash2 size={15} /></button>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-semibold text-black/65">
                    {application.deadline && <span className="flex items-center gap-1.5"><FiCalendar />Deadline: {new Date(application.deadline).toLocaleDateString()}</span>}
                    <span>Added {new Date(application.createdAt).toLocaleDateString()}</span>
                    {jobUrl && <a href={jobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sky-900 underline"><FiExternalLink />Job posting</a>}
                  </div>
                  {application.notes && <p className="whitespace-pre-wrap border-t border-black/15 pt-3 text-xs font-medium text-black/75">{application.notes}</p>}
                </article>
              );
            })}
          </section>
        </div>
      </div>
    </main>
    </div>
  );
}

export default Applications;
