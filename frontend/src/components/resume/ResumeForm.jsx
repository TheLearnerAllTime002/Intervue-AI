import React from 'react'
import { FiPlus, FiTrash2, FiLink } from 'react-icons/fi'

const FONTS = [
  "Times New Roman",
  "Georgia",
  "Garamond",
  "Palatino Linotype",
  "Arial",
  "Helvetica",
  "Calibri",
  "Trebuchet MS",
  "Roboto",
  "Inter",
  "Lato",
  "Open Sans",
  "Source Sans Pro",
  "Courier New",
]

const SECTION_PRESETS = [
  "Achievements", "Certifications", "Languages", "Hobbies & Interests",
  "Volunteer Work", "Publications", "Awards", "References", "Custom",
]

function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[10px] font-semibold text-black/70 uppercase tracking-wider'>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        value={value}
        className='bg-white border-2 border-black/25 text-[#0A0A0A] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-black/60 transition-colors placeholder-black/30 shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      />
    </div>
  )
}

function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className='flex flex-col gap-1'>
      <label className='text-[10px] font-semibold text-black/70 uppercase tracking-wider'>{label}</label>
      <textarea
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        value={value}
        rows={rows}
        className='bg-white border-2 border-black/25 text-[#0A0A0A] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-black/60 transition-colors placeholder-black/30 resize-none shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
      />
    </div>
  )
}

function EntryCard({ children, onRemove }) {
  return (
    <div className='relative overflow-hidden bg-[#F8F9FA] border-2 border-black/15 rounded-xl p-3 shadow-[0_2px_10px_rgba(0,0,0,0.05)]'>
      <button onClick={onRemove} className='absolute top-2.5 right-2.5 z-10 text-black/35 hover:text-red-500 transition-colors'>
        <FiTrash2 size={13} />
      </button>
      <div className='relative flex flex-col gap-2.5 pr-6'>{children}</div>
    </div>
  )
}

function ResumeForm({ step, data, setData }) {
  if (step === 1) {
    return (
      <div className='flex flex-col gap-3'>
        <Input label="Full Name" placeholder="Rahul Sharma" onChange={(v) => setData({ ...data, name: v })} value={data.name} />
        <Input label="Email" placeholder="rahul@email.com" onChange={(v) => setData({ ...data, email: v })} value={data.email} />
        <Input label="Phone" placeholder="+91 9876543210" onChange={(v) => setData({ ...data, phone: v })} value={data.phone} />
        <Input label="Location" placeholder="Jhansi, UP" onChange={(v) => setData({ ...data, location: v })} value={data.location} />
        <Input label="LinkedIn URL" placeholder="linkedin.com/in/rahul" onChange={(v) => setData({ ...data, linkedin: v })} value={data.linkedin} />
        <Input label="GitHub URL" placeholder="github.com/rahul" value={data.github} onChange={(v) => setData({ ...data, github: v })} />
        <Input label="Portfolio / Website" placeholder="rahul.dev" value={data.website} onChange={(v) => setData({ ...data, website: v })} />

        {/* Font Picker */}
        <div className='flex flex-col gap-1'>
          <label className='text-[10px] font-semibold text-black/70 uppercase tracking-wider'>Resume Font</label>
          <select
            value={data.font}
            onChange={(e) => setData({ ...data, font: e.target.value })}
            className='bg-white border-2 border-black/25 text-[#0A0A0A] text-xs rounded-lg px-2.5 py-2 outline-none focus:border-black/60 transition-colors shadow-[0_2px_8px_rgba(0,0,0,0.04)]'
          >
            {FONTS.map((f) => (
              <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
            ))}
          </select>
          <p className='text-[10px] text-black/40' style={{ fontFamily: data.font }}>
            Preview: The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </div>
    )
  }

  if (step === 2) {
    return (
      <div className='flex flex-col gap-3'>
        <TextArea
          label="Professional Summary"
          placeholder="Backend Developer with 2+ years of experience building scalable Node.js and MongoDB applications..."
          rows={5}
          onChange={(v) => setData({ ...data, summary: v })}
          value={data.summary}
        />
        <p className='text-[10px] text-black/40'>Leave empty to skip this section.</p>
      </div>
    )
  }

  if (step === 3) {
    return (
      <div className='flex flex-col gap-3'>
        <TextArea
          label="Skills (comma separated)"
          placeholder="JavaScript, TypeScript, React, Node.js, Express, MongoDB, Redis, Docker, AWS, Git"
          rows={4}
          onChange={(v) => setData({ ...data, skills: v })}
          value={data.skills}
        />
        <p className='text-[10px] text-black/40'>Separate each skill with a comma.</p>
      </div>
    )
  }

  if (step === 4) {
    const addExp = () => setData({ ...data, experience: [...data.experience, { company: "", role: "", duration: "", description: "" }] })
    const removeExp = (i) => setData({ ...data, experience: data.experience.filter((_, idx) => idx !== i) })
    const updateExp = (i, field, value) => setData({ ...data, experience: data.experience.map((e, idx) => idx === i ? { ...e, [field]: value } : e) })

    return (
      <div className='flex flex-col gap-3'>
        {data.experience.length === 0 && <p className='text-xs text-black/40 text-center py-3'>No experience added yet. Click below to add.</p>}
        {data.experience.map((exp, i) => (
          <EntryCard key={i} onRemove={() => removeExp(i)}>
            <Input label="Company" placeholder="ABC Technologies" onChange={(v) => updateExp(i, "company", v)} value={exp.company} />
            <Input label="Role" placeholder="Backend Developer" onChange={(v) => updateExp(i, "role", v)} value={exp.role} />
            <Input label="Duration" placeholder="Jan 2023 – Dec 2024" onChange={(v) => updateExp(i, "duration", v)} value={exp.duration} />
            <TextArea label="Description" placeholder={"• Built REST APIs\n• Improved performance by 40%"} onChange={(v) => updateExp(i, "description", v)} value={exp.description} />
          </EntryCard>
        ))}
        <button onClick={addExp} className='flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-black/20 rounded-xl text-xs text-black/45 hover:border-black/40 hover:text-[#0A0A0A] transition-all'>
          <FiPlus size={13} />Add Experience
        </button>
      </div>
    )
  }

  if (step === 5) {
    const addPro = () => setData({ ...data, projects: [...data.projects, { name: "", techStack: "", github: "", liveUrl: "", description: "" }] })
    const removePro = (i) => setData({ ...data, projects: data.projects.filter((_, idx) => idx !== i) })
    const updatePro = (i, field, value) => setData({ ...data, projects: data.projects.map((p, idx) => idx === i ? { ...p, [field]: value } : p) })

    return (
      <div className='flex flex-col gap-3'>
        {data.projects.length === 0 && <p className='text-xs text-black/40 text-center py-3'>No project added yet. Click below to add.</p>}
        {data.projects.map((pro, i) => (
          <EntryCard key={i} onRemove={() => removePro(i)}>
            <Input label="Project Name" placeholder="InterviewIQ" onChange={(v) => updatePro(i, "name", v)} value={pro.name} />
            <Input label="Tech Stack" value={pro.techStack} onChange={(v) => updatePro(i, "techStack", v)} placeholder="React, Node.js, MongoDB" />
            <Input label="GitHub Link" value={pro.github} onChange={(v) => updatePro(i, "github", v)} placeholder="github.com/rahul/interviewiq" />
            <Input label="Live URL (optional)" value={pro.liveUrl || ""} onChange={(v) => updatePro(i, "liveUrl", v)} placeholder="interviewiq.vercel.app" />
            <TextArea label="Description" value={pro.description} onChange={(v) => updatePro(i, "description", v)} placeholder="AI-powered interview preparation platform with mock interviews and resume builder." />
          </EntryCard>
        ))}
        <button onClick={addPro} className='flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-black/20 rounded-xl text-xs text-black/45 hover:border-black/40 hover:text-[#0A0A0A] transition-all'>
          <FiPlus size={13} />Add Project
        </button>
      </div>
    )
  }

  if (step === 6) {
    const addEdu = () => setData({ ...data, education: [...data.education, { college: "", degree: "", branch: "", cgpa: "", year: "" }] })
    const removeEdu = (i) => setData({ ...data, education: data.education.filter((_, idx) => idx !== i) })
    const updateEdu = (i, field, value) => setData({ ...data, education: data.education.map((e, idx) => idx === i ? { ...e, [field]: value } : e) })

    return (
      <div className='flex flex-col gap-3'>
        {data.education.length === 0 && <p className='text-xs text-black/40 text-center py-3'>No Education added yet. Click below to add.</p>}
        {data.education.map((edu, i) => (
          <EntryCard key={i} onRemove={() => removeEdu(i)}>
            <Input label="College / University" value={edu.college} onChange={(v) => updateEdu(i, "college", v)} placeholder="SR Group of Institutions" />
            <Input label="Degree" value={edu.degree} onChange={(v) => updateEdu(i, "degree", v)} placeholder="B.Tech" />
            <Input label="Branch" value={edu.branch} onChange={(v) => updateEdu(i, "branch", v)} placeholder="Computer Science" />
            <Input label="CGPA" value={edu.cgpa} onChange={(v) => updateEdu(i, "cgpa", v)} placeholder="8.5" />
            <Input label="Year" value={edu.year} onChange={(v) => updateEdu(i, "year", v)} placeholder="2021 – 2025" />
          </EntryCard>
        ))}
        <button onClick={addEdu} className='flex items-center justify-center gap-1.5 w-full py-2.5 border border-dashed border-black/20 rounded-xl text-xs text-black/45 hover:border-black/40 hover:text-[#0A0A0A] transition-all'>
          <FiPlus size={13} />Add Education
        </button>
      </div>
    )
  }

  if (step === 7) {
    const addSection = (title) => {
      setData({
        ...data,
        customSections: [
          ...data.customSections,
          { id: Date.now(), title: title === "Custom" ? "" : title, items: [{ text: "", url: "" }] },
        ],
      })
    }

    const removeSection = (id) => setData({ ...data, customSections: data.customSections.filter((s) => s.id !== id) })

    const updateSectionTitle = (id, title) =>
      setData({ ...data, customSections: data.customSections.map((s) => s.id === id ? { ...s, title } : s) })

    const addItem = (id) =>
      setData({ ...data, customSections: data.customSections.map((s) => s.id === id ? { ...s, items: [...s.items, { text: "", url: "" }] } : s) })

    const removeItem = (id, idx) =>
      setData({ ...data, customSections: data.customSections.map((s) => s.id === id ? { ...s, items: s.items.filter((_, i) => i !== idx) } : s) })

    const updateItem = (id, idx, field, value) =>
      setData({ ...data, customSections: data.customSections.map((s) => s.id === id ? { ...s, items: s.items.map((item, i) => i === idx ? { ...item, [field]: value } : item) } : s) })

    return (
      <div className='flex flex-col gap-4'>
        <div>
          <p className='text-[10px] font-semibold text-black/70 uppercase tracking-wider mb-2'>Add a section</p>
          <div className='flex flex-wrap gap-1.5'>
            {SECTION_PRESETS.map((preset) => (
              <button
                key={preset}
                onClick={() => addSection(preset)}
                className='px-2.5 py-1 text-[10px] font-semibold border border-black/20 rounded-lg bg-white hover:bg-sky-50 hover:border-sky-400 transition-all'
              >
                + {preset}
              </button>
            ))}
          </div>
        </div>

        {data.customSections.length === 0 && (
          <p className='text-xs text-black/40 text-center py-3'>No custom sections yet. Pick one above.</p>
        )}

        {data.customSections.map((section) => (
          <div key={section.id} className='border-2 border-black/15 rounded-xl overflow-hidden'>
            {/* Section header */}
            <div className='flex items-center gap-2 bg-[#F8F9FA] px-3 py-2 border-b border-black/10'>
              <input
                value={section.title}
                onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                placeholder="Section title (e.g. Achievements)"
                className='flex-1 bg-transparent text-xs font-bold outline-none placeholder-black/30'
              />
              <button onClick={() => removeSection(section.id)} className='text-black/35 hover:text-red-500 transition-colors'>
                <FiTrash2 size={13} />
              </button>
            </div>

            {/* Items */}
            <div className='flex flex-col gap-2 p-3'>
              {section.items.map((item, idx) => (
                <div key={idx} className='flex gap-2 items-start'>
                  <div className='flex-1 flex flex-col gap-1.5'>
                    <input
                      value={item.text}
                      onChange={(e) => updateItem(section.id, idx, "text", e.target.value)}
                      placeholder="e.g. Won national hackathon 2024"
                      className='w-full bg-white border border-black/20 text-xs rounded-lg px-2.5 py-1.5 outline-none focus:border-black/50 transition-colors placeholder-black/30'
                    />
                    <div className='flex items-center gap-1.5'>
                      <FiLink size={10} className='text-black/35 shrink-0' />
                      <input
                        value={item.url}
                        onChange={(e) => updateItem(section.id, idx, "url", e.target.value)}
                        placeholder="https://link (optional)"
                        className='w-full bg-white border border-black/15 text-[10px] rounded-lg px-2.5 py-1 outline-none focus:border-sky-400 transition-colors placeholder-black/25 text-sky-700'
                      />
                    </div>
                  </div>
                  <button onClick={() => removeItem(section.id, idx)} className='mt-1.5 text-black/30 hover:text-red-500 transition-colors shrink-0'>
                    <FiTrash2 size={12} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addItem(section.id)}
                className='flex items-center gap-1 text-[10px] text-black/45 hover:text-black transition-colors mt-1'
              >
                <FiPlus size={11} /> Add item
              </button>
            </div>
          </div>
        ))}
      </div>
    )
  }
}

export default ResumeForm
