import React from 'react'
import { useState } from 'react';
import { AnimatePresence, motion } from "motion/react";
import { FiBookOpen, FiChevronDown, FiChevronUp, FiClock, FiYoutube } from 'react-icons/fi';

const difficultyClass = { Easy: "bg-sky-100 text-sky-950", Medium: "bg-sky-200 text-sky-950", Hard: "bg-yellow-200 text-black" };
function ModuleCard({ mod, index }) {
    const [open, setOpen] = useState(false);
  return (
    <motion.div 
     initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.35 }}
      whileHover={{ y: -2 }}
      onClick={()=>setOpen(!open)}
    className='relative overflow-hidden neo-yellow-surface rounded-lg cursor-pointer select-none transition-all'>
        <div className='absolute inset-0 bg-gradient-to-br from-white/[0.07] via-transparent to-transparent pointer-events-none'/>

        <div className='relative flex items-center gap-3 p-4'>
            <div className={`w-8 h-8 flex items-center justify-center text-sm font-black border-2 border-black ${difficultyClass[mod.difficulty] || 'bg-sky-100 text-sky-950'}`}>{index + 1}</div>

            <div className='flex-1 min-w-0'>
                <p className='text-sm font-extrabold text-black truncate'>{mod.title}</p>
                <div className='flex items-center gap-1.5 mt-0.5'>
                    <FiClock size={11} className="text-sky-900"/>
                    <span className='text-xs font-semibold text-black/65'>{mod.duration}</span>
                </div>
            </div>

            <div className='flex items-center gap-2'>
                <span className={`text-[10px] font-extrabold border-2 border-black px-2 py-1 hidden sm:block ${difficultyClass[mod.difficulty] || 'bg-sky-100 text-sky-950'}`}>
            {mod.difficulty}
          </span>
          {open
            ? <FiChevronUp size={14} className="text-black" />
            : <FiChevronDown size={14} className="text-black" />
          }
            </div>
        </div>


        <AnimatePresence>
            {open && (
                <motion.div
                initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
                 className='overflow-hidden'>
                    <div className='relative px-4 pb-4 pt-0 border-t-2 border-black/20'>
                    
                    <p className='text-sm text-black/75 mt-3 mb-3 leading-relaxed'>{mod.description}</p>
                    <div className='flex gap-2 flex-wrap'>

                        <a href={mod.youtube} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <motion.button 
                            whileHover={{ scale: 1.03 }} 
                            whileTap={{ scale: 0.97 }}
                    className="neo-blue-surface flex items-center gap-1.5 text-xs px-3 py-1.5">
                        <FiYoutube size={12}/> Watch Tutorial

                            </motion.button>

                        </a>

                        <a href={mod.article} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                            <motion.button 
                            whileHover={{ scale: 1.03 }} 
                            whileTap={{ scale: 0.97 }}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5">
                        <FiBookOpen size={12}/> Read Article

                            </motion.button>

                        </a>
                    </div>
                    
                    </div>

                </motion.div>
            )}
        </AnimatePresence>
      
    </motion.div>
  )
}

export default ModuleCard
