import React from 'react'
import { motion } from "motion/react";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from 'recharts';

function CustomTooltip({ active, payload }) {
    if (active && payload?.length) {
        return (
                <div className='bg-[#0A0A0A]/95 border border-black rounded-lg px-2.5 py-1.5 text-[11px] text-black shadow-2xl'>
                <p className="mb-0.5 font-semibold text-black">{payload[0]?.payload?.skill}</p>
                <p className="font-bold text-black">{payload[0]?.value}%</p>

            </div>
        )
    }
}
function RadarCard({ title, data, color, index }) {
    return (

        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 + index * 0.1 }}
            whileHover={{ y: -4 }}
            className={`relative overflow-hidden bg-[#000000]/90 backdrop-blur-2xl border border-white/10 rounded-xl p-3 md:p-4
                 flex flex-col shadow-[0_8px_32px_rgba(0,0,0,0.18)] hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.28)] transition-all ${index % 2 ? "neo-blue-surface" : "neo-yellow-surface"}`}>
            <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />

            <div className='relative'>
                <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={data} cx="50%" cy="50%" outerRadius="62%" margin={{ top: 14, right: 24, bottom: 12, left: 24 }}>
                        <PolarGrid stroke="#171717" strokeOpacity={0.38} strokeWidth={1.5} gridType="circle" />
                        <PolarAngleAxis dataKey="skill"
                            tick={{ fill: "#171717", fontSize: 11, fontWeight: 700 }} />
                        <Radar
                            name={title}
                            dataKey="score"
                            stroke={color}
                            fill={color}
                            fillOpacity={0.24}
                            strokeWidth={3}
                            dot={{ r: 3.5, fill: color, stroke: "#171717", strokeWidth: 1.5 }} />
                        <Tooltip content={<CustomTooltip/>}/>
                    </RadarChart>
                </ResponsiveContainer>
                <p className='text-black font-bold text-xs text-center mt-2'>
                    {title}
                </p>
            </div>

        </motion.div>

    )
}

function InterviewGraph({ technicalData, hrData, technicalCount, hrCount }) {
    return (
        <div className='grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4'>
            <RadarCard title={`Technical Interviews (${technicalCount})`}
                data={technicalData} color="#b45309" index={0}
            />
            <RadarCard title={`HR Interviews (${hrCount})`}
                data={hrData} color="#0369a1" index={1}
            />

        </div>
    )
}

export default InterviewGraph
