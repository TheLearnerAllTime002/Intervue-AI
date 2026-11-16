import React from 'react'
import { motion } from "motion/react"
function Statbox({ label, value, sub, subHighlight, index = 0 }) {
  return (
    <motion.div 
    initial={{ opacity: 0, y: 20 }}

      animate={{ opacity: 1, y: 0 }}

      transition={{ duration: 0.4, delay: index * 0.08 }}

      whileHover={{ y: -4 }}
    className={`group relative overflow-hidden rounded-2xl border border-black/10 p-4 md:p-5 flex flex-col gap-1 shadow-sm hover:-translate-y-1 hover:shadow-md transition-all ${index % 2 ? "bg-sky-100" : "bg-yellow-100"}`}>

        <div className={`absolute -right-6 -top-7 h-20 w-20 rounded-full opacity-70 transition-transform group-hover:scale-125 ${index % 2 ? "bg-sky-200" : "bg-yellow-200"}`} />

        <p className='relative text-black/60 text-[9px] md:text-[11px] font-bold uppercase tracking-wider'>{label}</p>

        <p className='relative text-black text-2xl md:text-3xl font-black tracking-tight'>{value}</p>

        {sub && (
            <div className='relative flex items-center gap-1 mt-0.5 flex-wrap'>
                {subHighlight && (
                    <div className='text-[9px] font-bold bg-white/70 text-black/70 px-2 py-1 rounded-full'>{subHighlight}</div>
                )}

                <span className='text-black/50 text-[9px] md:text-[11px]'>{sub}</span>

            </div>
        )}


    </motion.div>
  )
}

export default Statbox
