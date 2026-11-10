import React from 'react'
import { motion } from "motion/react";
import { FiCheckCircle, FiClock, FiMap, FiTarget, FiX } from 'react-icons/fi';
import ModuleCard from './ModuleCard';
function RoadmapResult({roadmap, onClear}) {
  return (
    <motion.div 
    initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}>

        <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
         className='neo-blue-surface relative overflow-hidden rounded-lg p-5 mb-6'>
            <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none'/>

            <div className='relative flex items-start justify-between mb-4'>

                <div>
                    <p className='text-[10px] text-sky-950 font-extrabold tracking-widest uppercase mb-1'>Your roadmap</p>
                    <h2 className='text-2xl font-black text-black'>{roadmap.title}</h2>
                    <p className='text-sm font-semibold text-black/70 mt-1'>
                    Target: <span className="text-sky-950 font-extrabold">{roadmap.targetPackage}</span>
                    </p>
                </div>
                <button onClick={onClear} aria-label='Create a new roadmap' className='neo-yellow-surface mt-0.5 p-2'>
                <FiX size={16}/></button>
            </div>

            <div className='relative grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3'>
                {[
            { icon: FiTarget,      label: "Difficulty", value: roadmap.level },
            { icon: FiClock,       label: "Duration",   value: roadmap.duration },
            { icon: FiCheckCircle, label: "Modules",    value: `${roadmap.modules.length} topics` },
          ].map(({icon:Icon , label , value})=>(
            <div key={label} className='rounded-lg p-3 bg-white border-2 border-black'>
                <div className='flex items-center gap-1.5 mb-1'>
                    <Icon size={12} className="text-sky-900"/>
                    <span className='text-xs font-bold text-black/65'>{label}</span>
                    </div>
                    <p className='text-sm font-extrabold text-black'>{value}</p>

            </div>
          ))}
            </div>

        </motion.div>

        <div className='mb-4'>
            <p className='inline-flex border-2 border-black bg-sky-200 px-2 py-1 text-xs text-black font-extrabold uppercase tracking-widest mb-4 items-center gap-2'>
            <FiMap size={12}/> Learning Modules </p>
            <div className='flex flex-col gap-2'>
                {
                    roadmap.modules.map((m,i)=>(
                        <ModuleCard key={m.title} mod={m} index={i}/>
                    ))
                }
            </div>
        </div>
      
    </motion.div>
  )
}

export default RoadmapResult
