import React from 'react'

const FONT_STACK = {
  "Times New Roman": "'Times New Roman', Times, serif",
  "Georgia": "Georgia, serif",
  "Garamond": "'EB Garamond', Garamond, serif",
  "Palatino Linotype": "'Palatino Linotype', Palatino, serif",
  "Arial": "Arial, Helvetica, sans-serif",
  "Helvetica": "Helvetica, Arial, sans-serif",
  "Calibri": "Calibri, 'Gill Sans', sans-serif",
  "Trebuchet MS": "'Trebuchet MS', sans-serif",
  "Roboto": "'Roboto', sans-serif",
  "Inter": "'Inter', sans-serif",
  "Lato": "'Lato', sans-serif",
  "Open Sans": "'Open Sans', sans-serif",
  "Source Sans Pro": "'Source Sans 3', sans-serif",
  "Courier New": "'Courier New', Courier, monospace",
}

const normalizeUrl = (url) => {
  if (!url) return ""
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

function Link({ href, children }) {
  const url = normalizeUrl(href)
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" style={{ color: "inherit", textDecoration: "underline" }}>
      {children}
    </a>
  )
}

function ATSTemplate({ data }) {
  const {
    name, email, phone, location,
    linkedin, github, website,
    summary, skills, experience,
    projects, education,
    customSections = [],
    font = "Times New Roman",
  } = data

  const skillsList = skills ? skills.split(",").map((s) => s.trim()).filter(Boolean) : []
  const half = Math.ceil(skillsList.length / 2)
  const skillsCol1 = skillsList.slice(0, half)
  const skillsCol2 = skillsList.slice(half)

  const renderDesc = (text) => {
    if (!text) return null
    const lines = text.split("\n").map((l) => l.trim()).filter(Boolean)
    return (
      <ul className='mt-1 ml-4 list-disc p-0'>
        {lines.map((line, i) => (
          <li key={i} className='mb-[1px] text-[11px] leading-[1.6] text-black'>
            {line.replace(/^[-•]\s*/, "")}
          </li>
        ))}
      </ul>
    )
  }

  const contactItems = [
    email && { label: email, url: `mailto:${email}` },
    phone && { label: phone, url: null },
    location && { label: location, url: null },
    linkedin && { label: linkedin.replace(/^https?:\/\/(www\.)?/i, ""), url: linkedin },
    github && { label: github.replace(/^https?:\/\/(www\.)?/i, ""), url: github },
    website && { label: website.replace(/^https?:\/\/(www\.)?/i, ""), url: website },
  ].filter(Boolean)

  return (
    <div
      className='box-border w-[210mm] min-h-[297mm] bg-white px-[18mm] py-[15mm] text-black'
      style={{ fontFamily: FONT_STACK[font] || `'${font}', serif` }}
    >
      {/* Header */}
      <div className='mb-[10px] border-b-2 border-black pb-[10px] text-center'>
        <h2 className='m-0 mb-[7px] text-[28px] font-bold uppercase tracking-[0.08em]'>{name || "YOUR NAME"}</h2>
        <div className='flex flex-wrap justify-center text-[10.5px] text-black'>
          {contactItems.map((item, i) => (
            <span key={i} className='whitespace-nowrap'>
              {item.url ? <Link href={item.url}>{item.label}</Link> : item.label}
              {i < contactItems.length - 1 && <span className="mx-[7px] text-black">|</span>}
            </span>
          ))}
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <section className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            Professional Summary
          </h2>
          <p className='m-0 text-[11px] leading-[1.65]'>{summary}</p>
        </section>
      )}

      {/* Skills */}
      {skillsList.length > 0 && (
        <section className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            Technical Skills
          </h2>
          <div className='grid grid-cols-2 gap-y-[2px] gap-x-[20px]'>
            <ul className='m-0 list-disc pl-4'>
              {skillsCol1.map((s, i) => <li key={i} className='text-[11px] leading-[1.7] capitalize'>{s}</li>)}
            </ul>
            <ul className='m-0 list-disc pl-4'>
              {skillsCol2.map((s, i) => <li key={i} className='text-[11px] leading-[1.7] capitalize'>{s}</li>)}
            </ul>
          </div>
        </section>
      )}

      {/* Experience */}
      {experience.length > 0 && (
        <section className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            Work Experience
          </h2>
          {experience.map((exp, i) => (
            <div key={i} className='mb-[11px] break-inside-avoid'>
              <div className='flex items-baseline justify-between'>
                <span className='text-[12px] font-bold'>{exp.role}</span>
                <span className='ml-2 whitespace-nowrap text-[10.5px]'>{exp.duration}</span>
              </div>
              <div className='mb-[2px] text-[11px] italic'>{exp.company}</div>
              {renderDesc(exp.description)}
            </div>
          ))}
        </section>
      )}

      {/* Projects */}
      {projects.length > 0 && (
        <section className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            Projects
          </h2>
          {projects.map((proj, i) => (
            <div key={i} className='mb-[11px] break-inside-avoid'>
              <div className='flex items-baseline justify-between gap-2'>
                <span className='text-[12px] font-bold'>{proj.name}</span>
                <span className='flex gap-3 whitespace-nowrap text-[10.5px] shrink-0'>
                  {proj.github && <Link href={proj.github}>GitHub</Link>}
                  {proj.liveUrl && <Link href={proj.liveUrl}>Live</Link>}
                </span>
              </div>
              {proj.techStack && (
                <div className='mb-[2px] text-[11px] italic'>
                  <span className="font-bold">Tech Stack: </span>{proj.techStack}
                </div>
              )}
              {renderDesc(proj.description)}
            </div>
          ))}
        </section>
      )}

      {/* Education */}
      {education.length > 0 && (
        <section className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            Education
          </h2>
          {education.map((edu, i) => (
            <div key={i} className='mb-[11px] break-inside-avoid'>
              <div className='flex items-baseline justify-between'>
                <span className='text-[12px] font-bold'>{edu.degree}{edu.branch ? ` in ${edu.branch}` : ""}</span>
                <span className='ml-2 whitespace-nowrap text-[10.5px]'>{edu.year}</span>
              </div>
              <div className='mb-[2px] text-[11px] italic'>
                {edu.college}
                {edu.cgpa && <span className="ml-[6px]">| CGPA: <strong>{edu.cgpa}</strong></span>}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Custom Sections */}
      {customSections.filter((s) => s.title && s.items.some((it) => it.text)).map((section) => (
        <section key={section.id} className='mb-[13px]'>
          <h2 className='mt-0 mb-[9px] border-b-[1.5px] border-black pb-[3px] text-[10.5px] font-bold uppercase tracking-[0.14em]'>
            {section.title}
          </h2>
          <ul className='m-0 list-disc pl-4'>
            {section.items.filter((it) => it.text).map((item, i) => (
              <li key={i} className='text-[11px] leading-[1.7]'>
                {item.url ? <Link href={item.url}>{item.text}</Link> : item.text}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

export default ATSTemplate
