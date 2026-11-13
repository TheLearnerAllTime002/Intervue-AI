import React, { useEffect, useState } from 'react'
import { motion } from "motion/react"
import { FiArrowDownLeft, FiArrowLeft, FiArrowUpRight, FiCheckCircle, FiLock } from 'react-icons/fi'
import { GiTwoCoins } from 'react-icons/gi'
import PricingCard from '../components/PricingCard'
import api from '../utils/axios'
import { useNavigate } from 'react-router-dom'
import { getCoinHistory } from '../apis/user.api'
import { ListSkeleton } from '../components/Skeleton'

const plans = [
    {
        title: "Free",
        price: "Free",
        coins: 150,
        button: "Included",
        popular: false,
        disabled: true,
        features: ["150 Interview Coins", "Resume Builder", "Resume Scorer", "Roadmap Generator"],
    },
    {
        title: "Starter",
        price: "199",
        coins: 300,
        button: "Buy 300 coins",
        popular: true,
        disabled: false,
        features: ["300 Interview Coins", "Unlimited Resume Score", "Unlimited Roadmaps", "Priority AI Response"],
    },
]

const COIN_ACTION_LABELS = {
    "resume-scorer": "Resume Scorer",
    "start-interview": "AI Interview",
    "roadmap-builder": "Roadmap Generator",
    "download-pdf": "Resume Builder PDF",
    "coin-purchase": "Coin package purchase",
}

function Billing({ user, setUser }) {
    const [checkoutPlan, setCheckoutPlan] = useState("")
    const [checkoutError, setCheckoutError] = useState("")
    const [coinHistory, setCoinHistory] = useState([])
    const [historyLoading, setHistoryLoading] = useState(true)
    const [historyError, setHistoryError] = useState("")
    const navigate = useNavigate()

    useEffect(() => {
        let active = true
        getCoinHistory()
            .then((result) => {
                if (!active) return
                setCoinHistory(result.transactions || [])
                if (Number.isFinite(Number(result.interviewCoin))) {
                    setUser((current) => ({ ...current, interviewCoin: Number(result.interviewCoin) }))
                }
            })
            .catch((error) => {
                if (active) setHistoryError(error.response?.data?.message || "Could not load coin activity.")
            })
            .finally(() => { if (active) setHistoryLoading(false) })
        return () => { active = false }
    }, [setUser])

    const handlePayment = async (selectedPlan) => {
        if (selectedPlan.disabled || checkoutPlan) return
        setCheckoutPlan(selectedPlan.title)
        setCheckoutError("")

        try {
            const result = await api.post("/api/billing/create", { planId: selectedPlan.title.toLowerCase() })
            const razorpayKey = result.data.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID
            if (!razorpayKey) throw new Error("Razorpay test key ID is missing. Set VITE_RAZORPAY_KEY_ID in frontend/.env and restart the frontend.")
            if (!window.Razorpay) throw new Error("Razorpay Checkout did not load. Refresh the page and try again.")

            const options = {
                key: razorpayKey,
                amount: result.data.order.amount,
                currency: result.data.order.currency,
                name: "Intervue AI",
                description: `${selectedPlan.title} - ${selectedPlan.coins} Interview Coins`,
                order_id: result.data.order.id,
                handler: async (paymentResponse) => {
                    try {
                        const verification = await api.post("/api/billing/verify", paymentResponse)
                        setUser((current) => ({ ...current, interviewCoin: verification.data.interviewCoin }))
                        navigate("/dashboard")
                    } catch (error) {
                        setCheckoutError(error.response?.data?.message || "Payment verification failed. Contact support with your payment receipt.")
                    }
                },
                theme: { color: "#8bd8ff" },
                modal: { ondismiss: () => setCheckoutPlan("") },
            }

            const razorpay = new window.Razorpay(options)
            razorpay.on("payment.failed", (event) => {
                setCheckoutError(event.error?.description || "Payment failed. You can try again.")
                setCheckoutPlan("")
            })
            razorpay.open()
            setCheckoutPlan("")
        } catch (error) {
            console.error("Could not start Razorpay checkout:", error)
            setCheckoutError(error.response?.data?.message || error.message || "Could not start checkout. Please try again.")
            setCheckoutPlan("")
        }
    }

    return (
        <div className='min-h-screen bg-[var(--neo-paper)] text-black'>
            <motion.nav
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
                className='sticky top-0 z-20 border-b-2 border-black bg-[var(--neo-paper)]'
            >
                <div className='mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6'>
                    <button type='button' onClick={() => navigate("/dashboard")} className='resume-home-button flex items-center gap-1.5 p-0'>
                        <span className='text-sm font-extrabold sm:text-base'>Intervue AI</span>
                        <span className='hidden border-2 border-black bg-sky-200 px-2 py-0.5 text-[10px] font-bold sm:block'>BILLING</span>
                    </button>
                    <button type='button' onClick={() => navigate("/dashboard")} className='flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-extrabold sm:px-3'><FiArrowLeft /> <span className='hidden sm:inline'>Dashboard</span></button>
                </div>
            </motion.nav>

            <main className='mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-12'>
                <header className='mx-auto grid max-w-5xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_270px]'>
                    <div>
                        <p className='inline-flex items-center gap-2 border-2 border-black bg-sky-200 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] shadow-[3px_3px_0_#171717]'><GiTwoCoins size={14} /> Interview Coin Wallet</p>
                        <h1 className='mt-4 text-3xl font-black leading-tight sm:text-5xl'>Invest in your next opportunity.</h1>
                        <p className='mt-3 max-w-xl text-sm font-semibold leading-6 text-sky-950 sm:text-base'>Choose a coin package to keep practicing interviews, improving your resume, and building your career roadmap.</p>
                    </div>
                    <div className='flex items-center gap-4 border-2 border-black bg-yellow-200 p-4 shadow-[5px_5px_0_#171717] sm:p-5'>
                        <span className='flex h-12 w-12 shrink-0 items-center justify-center border-2 border-black bg-white text-sky-900'><GiTwoCoins size={26} /></span>
                        <div>
                            <p className='text-[10px] font-black uppercase tracking-widest text-sky-950'>Coins remaining</p>
                            <p className='mt-0.5 text-3xl font-black text-black'>{Number(user?.interviewCoin || 0).toLocaleString()}</p>
                            <p className='text-[10px] font-semibold text-black/65'>Available to use</p>
                        </div>
                    </div>
                </header>

                <div className='mx-auto mt-8 grid max-w-4xl items-stretch justify-items-center gap-6 md:grid-cols-2 md:gap-8'>
                    {plans.map((plan) => (
                        <PricingCard
                            key={plan.title}
                            {...plan}
                            loading={checkoutPlan === plan.title}
                            onBuy={() => handlePayment(plan)}
                        />
                    ))}
                </div>

                {checkoutError && <p role='alert' className='mx-auto mt-6 max-w-4xl border-2 border-black bg-red-100 p-4 text-sm font-bold text-red-950 shadow-[3px_3px_0_#171717]'>{checkoutError}</p>}

                <section className='mx-auto mt-8 max-w-4xl border-2 border-black bg-sky-100 p-4 shadow-[5px_5px_0_#171717] sm:p-5' aria-labelledby='coin-usage-heading'>
                    <div className='mb-4 flex flex-wrap items-end justify-between gap-2'>
                        <div>
                            <p className='text-[10px] font-black uppercase tracking-widest text-sky-950'>Your account activity</p>
                            <h2 id='coin-usage-heading' className='mt-1 text-lg font-black'>Coin usage history</h2>
                        </div>
                        <span className='text-[10px] font-bold text-black/60'>Recent spending and coin purchases</span>
                    </div>
                    {historyError && <p role='alert' className='mb-3 border-2 border-black bg-red-100 p-3 text-xs font-bold text-red-950'>{historyError}</p>}
                    {historyLoading ? (
                        <ListSkeleton count={2} />
                    ) : coinHistory.length === 0 ? (
                        <div className='border-2 border-dashed border-black bg-white p-5 text-center'>
                            <GiTwoCoins className='mx-auto mb-2 text-sky-900' size={24} />
                            <p className='text-sm font-black'>No coin activity yet</p>
                            <p className='mt-1 text-xs font-semibold text-black/60'>Feature usage and future coin purchases will appear here.</p>
                        </div>
                    ) : (
                        <ul className='space-y-2'>
                            {coinHistory.map((entry, index) => {
                                const purchased = entry.kind === "purchase"
                                const label = COIN_ACTION_LABELS[entry.action] || entry.action?.replaceAll("-", " ") || "Coin activity"
                                return (
                                    <li key={`${entry.action}-${entry.createdAt}-${index}`} className='flex items-center gap-3 border-2 border-black bg-white p-3'>
                                        <span className={`flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black ${purchased ? 'bg-sky-200 text-sky-950' : 'bg-yellow-200 text-black'}`}>
                                            {purchased ? <FiArrowDownLeft size={17} /> : <FiArrowUpRight size={17} />}
                                        </span>
                                        <span className='min-w-0 flex-1'>
                                            <span className='block truncate text-xs font-black capitalize text-black'>{label}</span>
                                            <time className='mt-0.5 block text-[10px] font-semibold text-black/55' dateTime={entry.createdAt}>{new Date(entry.createdAt).toLocaleString()}</time>
                                        </span>
                                        <span className={`shrink-0 border border-black px-2 py-1 text-[10px] font-black ${purchased ? 'bg-sky-100 text-sky-950' : 'bg-yellow-100 text-black'}`}>
                                            {purchased ? "+" : "−"}{entry.coins} coins
                                        </span>
                                    </li>
                                )
                            })}
                        </ul>
                    )}
                </section>

                <section className='mx-auto mt-8 flex max-w-4xl items-start gap-3 border-2 border-black bg-white p-4 shadow-[4px_4px_0_#171717] sm:p-5'>
                    <span className='flex h-9 w-9 shrink-0 items-center justify-center border-2 border-black bg-sky-100'><FiLock className='text-sky-950' /></span>
                    <div>
                        <h2 className='text-sm font-black'>Secure checkout</h2>
                        <p className='mt-1 text-xs font-semibold leading-5 text-black/65'>Payment is handled by Razorpay. Coins are added to your account after the payment is verified.</p>
                    </div>
                    <FiCheckCircle className='ml-auto mt-1 shrink-0 text-sky-900' size={18} />
                </section>
            </main>
        </div>
    )
}

export default Billing
