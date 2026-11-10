import React from 'react'
import { FiCheck, FiLock } from 'react-icons/fi'
import { GiTwoCoins } from 'react-icons/gi'

function PricingCard({ title, price, coins, button, features, popular, disabled, loading, onBuy }) {
    return (
        <article className={`relative flex w-full max-w-md flex-col border-2 border-black p-5 shadow-[6px_6px_0_#171717] transition-transform sm:p-6 ${popular ? 'bg-sky-100' : 'bg-yellow-100'}`}>
            {popular && <span className='absolute -top-3 right-4 border-2 border-black bg-yellow-300 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide shadow-[2px_2px_0_#171717]'>Best value</span>}

            <div className='flex items-start justify-between gap-3'>
                <div>
                    <p className='text-[10px] font-black uppercase tracking-[0.16em] text-sky-950'>Coin package</p>
                    <h2 className='mt-1 text-xl font-black text-black'>{title}</h2>
                </div>
                <span className='flex h-10 w-10 shrink-0 items-center justify-center border-2 border-black bg-white text-sky-950'><GiTwoCoins size={20} /></span>
            </div>

            <div className='mt-5 flex items-end gap-2'>
                <span className='text-4xl font-black leading-none text-black'>{price === 'Free' ? price : `INR ${price}`}</span>
                {price !== 'Free' && <span className='pb-1 text-xs font-bold text-black/60'>one-time</span>}
            </div>

            <div className='mt-4 flex items-center gap-2 border-2 border-black bg-white p-3 shadow-[3px_3px_0_#171717]'>
                <GiTwoCoins className='text-sky-900' size={19} />
                <span className='text-sm font-black text-black'>{coins} Interview Coins</span>
            </div>

            <ul className='mt-5 flex-1 space-y-3'>
                {features.map((feature) => (
                    <li key={feature} className='flex items-start gap-2.5 text-xs font-semibold text-black'>
                        <span className='mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center border border-black bg-sky-200'><FiCheck size={11} /></span>
                        <span>{feature}</span>
                    </li>
                ))}
            </ul>

            <button type='button' disabled={disabled || loading} onClick={onBuy} className={`mt-6 flex w-full items-center justify-center gap-2 border-2 border-black px-4 py-3 text-sm font-black shadow-[3px_3px_0_#171717] ${disabled ? 'bg-white text-black/50' : popular ? 'bg-yellow-300 text-black' : 'bg-sky-300 text-black'}`}>
                {loading ? 'Opening checkout...' : disabled ? 'Included with your account' : <><FiLock size={14} />{button}</>}
            </button>
        </article>
    )
}

export default PricingCard
