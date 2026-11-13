import React from 'react'
import { motion } from "motion/react"
import { GiArtificialHive } from "react-icons/gi";
import { FaArrowRight } from "react-icons/fa6";
import LoginModel from '../components/LoginModel';
import { useState } from 'react';
import dashboard from "../assets/image.png"
import { FiMic, FiFileText, FiBarChart2, FiMap } from "react-icons/fi";
import { Link } from 'react-router-dom'

const prepSteps = [
    { number: '01', title: 'Set your target', description: 'Choose a role and experience level so every practice session starts with the right context.' },
    { number: '02', title: 'Practice out loud', description: 'Work through realistic questions with an AI interviewer, at your own pace.' },
    { number: '03', title: 'Turn feedback into progress', description: 'Review clear feedback and follow a roadmap built around your next steps.' },
]

function Home({ setUser }) {
    const [showLogin, setShowLogin] = useState(false)
    return (
        <div className='bg-white text-[#0A0A0A] font-sans min-h-screen overflow-x-hidden'>

            {/* navbar */}

            <motion.nav
                initial={{ y: -60, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className='fixed top-0 left-0 right-0 z-50 h-[52px] flex items-center justify-between px-5 bg-white/70 backdrop-blur-xl border-b border-black/5'>

                <div className='flex items-center gap-2'>

                    <div className='w-7 h-7 rounded-lg bg-[#0A0A0A] flex items-center justify-center shadow-[0_4px_14px_rgba(0,0,0,0.18)]'>
                        <GiArtificialHive size={15} color='#171717' /></div>

                    <span className='font-extrabold text-base tracking-tight text-[#0A0A0A]'>Intervue AI</span>
                </div>

                <motion.button
                    onClick={() => setShowLogin(true)}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className='bg-[#0A0A0A]/80 backdrop-blur-2xl text-white font-semibold border border-white/10 rounded-md px-3 py-1.5 text-xs cursor-pointer transition-all hover:border-white/20 shadow-[0_8px_24px_rgba(0,0,0,0.25)] flex items-center gap-2'>
                    Log In <FaArrowRight />

                </motion.button>

            </motion.nav>

            {/* main area */}
            <section className='relative isolate overflow-hidden bg-[#F8F9FA] px-5 pb-14 pt-28 sm:px-8 sm:pb-20 sm:pt-32'>
                <div className='pointer-events-none absolute -right-32 -top-32 h-[520px] w-[520px] rounded-full bg-sky-200/60 blur-[100px]' />
                <div className='pointer-events-none absolute -bottom-52 -left-40 h-[460px] w-[460px] rounded-full bg-yellow-200/70 blur-[100px]' />
                <div className='relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10'>
                <div className='max-w-2xl text-center lg:text-left'>
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.05 }}
                        className='mb-6 inline-flex items-center gap-2 border-2 border-black bg-sky-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-950 shadow-[3px_3px_0_#171717]'>
                        <span className='h-2 w-2 rounded-full bg-sky-700' />
                        Multi-Agent Interview Platform

                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.12 }}
                        className='mb-5 font-serif text-5xl font-black leading-[0.98] tracking-[-0.055em] text-black sm:text-6xl md:text-7xl'>
                        Interview prep,<br />
                        <span className='text-sky-950'>without the</span><br />
                        <span className='mt-2 inline-block -rotate-1 border-2 border-black bg-yellow-300 px-3 py-1.5 text-black shadow-[5px_5px_0_#171717]'>guesswork.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.2 }}
                        className='mx-auto mb-7 max-w-lg font-sans text-sm font-medium leading-7 text-sky-950 sm:text-base lg:mx-0'>
                        Practice with realistic AI interviews, get clear feedback, and build a plan for the role you want, all in one place.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, delay: 0.28 }}>

                        <motion.button
                            onClick={() => setShowLogin(true)}
                            whileHover={{ scale: 1.05, boxShadow: "0 0 36px rgba(0,0,0,0.18)" }}
                            whileTap={{ scale: 0.97 }}
                            className='relative gap-2 overflow-hidden bg-[#0A0A0A]/80 px-5 py-3 text-sm font-bold text-white cursor-pointer border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.3)] transition-all hover:border-white/20'>
                            <span className='flex items-center justify-center gap-2'> Get Started For Free <FaArrowRight /></span>
                            <span className='absolute inset-0 bg-gradient-to-br from-white/[0.1] via-transparent to-transparent pointer-events-none rounded-lg' />
                        </motion.button>
                    </motion.div>
                    <div className='mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-[11px] font-bold text-black/60 lg:justify-start'>
                        <span className='flex items-center gap-1.5'><FiMic className='text-sky-800' /> Realistic practice</span>
                        <span className='flex items-center gap-1.5'><FiBarChart2 className='text-sky-800' /> Actionable feedback</span>
                        <span className='flex items-center gap-1.5'><FiMap className='text-sky-800' /> Personal roadmap</span>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -6 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className='relative mx-auto w-full max-w-2xl lg:mt-2'>

                    <div className='absolute -inset-3 rotate-2 border-2 border-black bg-sky-200 shadow-[6px_6px_0_#171717]' />
                    <div className='relative overflow-hidden border-2 border-black bg-white p-2 shadow-[8px_8px_0_#171717] sm:p-3'>
                        <div className='mb-2 flex items-center gap-1.5 px-1'><span className='h-2.5 w-2.5 rounded-full bg-rose-400' /><span className='h-2.5 w-2.5 rounded-full bg-yellow-400' /><span className='h-2.5 w-2.5 rounded-full bg-green-400' /><span className='ml-2 text-[9px] font-bold tracking-wide text-black/45'>YOUR INTERVIEW WORKSPACE</span></div>
                        <img src={dashboard} alt='Intervue AI dashboard showing interview preparation progress' className='block h-auto w-full object-cover' />
                    </div>
                    <div className='absolute -bottom-5 -left-3 border-2 border-black bg-yellow-300 px-3 py-2 text-[10px] font-black shadow-[3px_3px_0_#171717] sm:-left-7 sm:text-xs'>Your next interview, handled.</div>

                </motion.div>
                </div>

            </section>

            {/* How it works */}
            <section className='relative overflow-hidden bg-[#fff9e9] px-5 py-20 sm:px-8 sm:py-28'>
                <div className='pointer-events-none absolute -right-24 top-12 h-72 w-72 rounded-full bg-sky-200/50 blur-3xl' />
                <div className='relative mx-auto max-w-6xl'>
                    <motion.div
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.35 }}
                        transition={{ duration: 0.55 }}
                        className='mx-auto mb-14 max-w-2xl text-center'>
                        <span className='inline-flex border-2 border-black bg-yellow-300 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-black shadow-[3px_3px_0_#171717]'>Your path to interview-ready</span>
                        <h2 className='mt-6 font-serif text-3xl font-black leading-tight tracking-[-0.04em] text-black sm:text-5xl'>A little practice.<br /><span className='text-sky-950'>A lot more confidence.</span></h2>
                        <p className='mx-auto mt-4 max-w-xl text-sm font-medium leading-7 text-sky-950 sm:text-base'>Move from your target role to a clear plan, one focused step at a time.</p>
                    </motion.div>

                    <div className='relative grid gap-5 md:grid-cols-3'>
                        <svg aria-hidden='true' className='pointer-events-none absolute left-[16%] right-[16%] top-7 hidden h-24 w-[68%] overflow-visible md:block' viewBox='0 0 800 100' fill='none' preserveAspectRatio='none'>
                            <motion.path d='M5 50 C 150 0, 245 100, 400 50 S 650 0, 795 50' stroke='#171717' strokeWidth='4' strokeLinecap='round' strokeDasharray='10 12' initial={{ pathLength: 0, opacity: 0 }} whileInView={{ pathLength: 1, opacity: 1 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 2, ease: 'easeInOut' }} />
                            <motion.circle r='10' fill='#ffe15a' stroke='#171717' strokeWidth='4' initial={{ cx: 5, cy: 50 }} whileInView={{ cx: 795, cy: 50 }} viewport={{ once: true, amount: 0.6 }} transition={{ duration: 2.5, ease: 'easeInOut', delay: 0.1 }} />
                        </svg>
                        {prepSteps.map((step, index) => (
                            <motion.article
                                key={step.number}
                                initial={{ opacity: 0, x: index === 0 ? -110 : index === 2 ? 110 : 0, y: index === 1 ? 90 : 30, rotate: index === 0 ? -8 : index === 2 ? 8 : 0, scale: 0.88 }}
                                whileInView={{ opacity: 1, x: 0, y: 0, rotate: 0, scale: 1 }}
                                viewport={{ once: true, amount: 0.45 }}
                                transition={{ type: 'spring', stiffness: 85, damping: 14, delay: index * 0.18 }}
                                className={`relative z-10 border-2 border-black p-6 shadow-[7px_7px_0_#171717] ${index === 1 ? 'bg-sky-200' : 'bg-white'}`}>
                                <motion.div initial={{ rotate: -25, scale: 0.5 }} whileInView={{ rotate: 0, scale: 1 }} viewport={{ once: true, amount: 0.45 }} transition={{ type: 'spring', stiffness: 180, damping: 10, delay: index * 0.18 + 0.2 }} className='mb-6 flex h-12 w-12 items-center justify-center border-2 border-black bg-yellow-300 font-mono text-sm font-black shadow-[3px_3px_0_#171717]'>{step.number}</motion.div>
                                <h3 className='mb-2 font-serif text-xl font-black tracking-tight text-black'>{step.title}</h3>
                                <p className='text-sm font-medium leading-6 text-sky-950'>{step.description}</p>
                            </motion.article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Agents */}
            <section className='py-16 bg-[#F8F9FA]'>
                <div className='max-w-5xl mx-auto px-6'>
                    <div className='text-center mb-10'>
                        <div className='inline-flex items-center border-2 border-black bg-sky-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.14em] text-sky-950 shadow-[3px_3px_0_#171717] mb-5'>
                            AI Powered Agents
                        </div>

                        <h2 className='font-serif text-3xl md:text-5xl font-black leading-tight tracking-[-0.035em] text-black'>
                            <span className='block'>Specialized Agents</span>
                            <span className="mt-1 block text-sky-950">
                                For Every Interview Stage
                            </span>
                        </h2>

                        <p className='mx-auto mt-5 max-w-2xl text-sm sm:text-base font-medium leading-7 text-sky-950'>
                            Intervue AI combines multiple AI agents that work together
                            to help you build your resume, practice interviews,
                            receive detailed feedback, and follow a personalized roadmap
                            to land your dream job.
                        </p>
                    </div>
                    <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4'>
                        {
                            [
                                {
                                    icon: <FiFileText />,
                                    title: "Resume Agent",
                                    desc: "Create ATS-friendly resumes, improve profile strength and maximize interview opportunities.",
                                },
                                {
                                    icon: <FiMic />,
                                    title: "Interview Agent",
                                    desc: "Conduct realistic HR, Technical and Coding interviews with AI-powered simulations.",
                                },
                                {
                                    icon: <FiBarChart2 />,
                                    title: "Feedback Agent",
                                    desc: "Get detailed answer analysis, scoring reports and improvement recommendations.",
                                },
                                {
                                    icon: <FiMap />,
                                    title: "Roadmap Agent",
                                    desc: "Generate personalized learning roadmaps based on goals, skills and performance.",
                                },
                            ].map((agent, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 24 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.45, delay: i * 0.08 }}
                                    whileHover={{ y: -10, scale: 1.02 }}
                                    className={`group relative overflow-hidden bg-[#0A0A0A]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-5 shadow-[0_8px_32px_rgba(0,0,0,0.25)] hover:shadow-[0_16px_48px_rgba(0,0,0,0.4)] hover:border-white/20 transition-all ${i % 2 ? "neo-blue-surface" : "neo-yellow-surface"}`}>
                                        <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none'/>

                                        <div className='absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500'/>

                                        <div className='relative'>
                                            <div className='w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center text-white text-lg mb-4 shadow-inner'>{agent.icon}</div>

                                            <h2 className='text-base font-bold mb-2 text-white'>{agent.title}</h2>

                                            <p className='text-white/45 text-xs leading-relaxed'>{agent.desc}</p>
                                        </div>

                                </motion.div>
                            ))
                        }
                    </div>
                </div>
            </section>

            {showLogin && <LoginModel onClose={() => setShowLogin(false)} setUser={setUser} />}

                <footer className='border-t border-black/7 py-6 text-center bg-white'>
                <div className='flex items-center justify-center gap-2 mb-1.5'>
                    <div className='w-5 h-5 rounded-md bg-[#0A0A0A] flex items-center justify-center'>
                        <GiArtificialHive size={11} color='#171717'/>

                    </div>
                    <span className='font-bold text-xs text-[#0A0A0A]/70'>Intervue AI</span>
                </div>
                <div className='text-black/50 text-xs'>
                © {new Date().getFullYear()} Intervue AI · All rights reserved
                </div>

                <Link to='/contact' className='mt-3 inline-block text-xs font-extrabold text-sky-900 underline'>Contact Us</Link>
                </footer>


        </div>
    )
}

export default Home
