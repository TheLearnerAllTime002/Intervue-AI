import React, { useState } from 'react'
import { FiArrowRight, FiLock, FiX } from "react-icons/fi";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import api from '../utils/axios';

function LoginModel({ onClose, setUser }) {
    const [isSigningIn, setIsSigningIn] = useState(false)
    const [errorMessage, setErrorMessage] = useState('')

    const handleGoogleAuth = async () => {
        if (isSigningIn) return
        setIsSigningIn(true)
        setErrorMessage('')
        try {
            // Clear Firebase's persisted account before opening the chooser so
            // switching Google accounts does not reuse the previous session.
            if (auth.currentUser) {
                await signOut(auth)
            }
            const result = await signInWithPopup(auth, provider)
            const token = await result.user.getIdToken()
            const response = await api.post("/api/auth/login", { token })

            setUser(response?.data?.user)
            onClose()
        } catch (error) {
            if (error.code !== 'auth/cancelled-popup-request' && error.code !== 'auth/popup-closed-by-user') {
                setErrorMessage(error.response?.data?.message || 'Unable to sign in. Please try again.')
                console.error('Google sign-in failed:', error)
            }
        } finally {
            setIsSigningIn(false)
        }
    }

    return (
        <div
            className='fixed inset-0 z-50 flex items-center justify-center bg-sky-950/55 px-4 py-6 backdrop-blur-sm'
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
        >
            <motion.div
                role='dialog'
                aria-modal='true'
                aria-labelledby='login-title'
                initial={{ opacity: 0, y: 18, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className='relative w-full max-w-md overflow-hidden border-2 border-black bg-[var(--neo-paper)] shadow-[7px_7px_0_#171717]'
                onMouseDown={(event) => event.stopPropagation()}
            >
                <div className='h-3 border-b-2 border-black bg-sky-300' />

                <div className='relative p-6 sm:p-8'>
                    <button
                        type='button'
                        onClick={onClose}
                        aria-label='Close sign in'
                        className='login-close-button absolute right-5 top-5 flex h-9 w-9 items-center justify-center'
                    >
                        <FiX size={17} />
                    </button>

                    <p className='mb-4 inline-block border-2 border-black bg-yellow-300 px-2 py-1 text-[10px] font-black uppercase tracking-[0.16em]'>Welcome to Intervue AI</p>

                    <div className='mb-4 flex h-12 w-12 items-center justify-center border-2 border-black bg-sky-200 shadow-[3px_3px_0_#171717]'>
                        <FiLock size={20} className='text-sky-950' />
                    </div>

                    <h2 id='login-title' className='font-serif text-3xl font-black leading-tight text-black sm:text-4xl'>Sign in to get interview-ready.</h2>
                    <p className='mt-3 max-w-sm text-sm font-medium leading-6 text-sky-950'>Continue your AI interview journey with personalized practice, clear feedback, and a plan for what comes next.</p>

                    <motion.button
                        type='button'
                        onClick={handleGoogleAuth}
                        disabled={isSigningIn}
                        aria-busy={isSigningIn}
                        whileHover={{ y: -1 }}
                        whileTap={{ y: 1 }}
                        className='login-google-button mt-7 flex w-full items-center justify-center gap-3 px-4 py-3.5 text-sm'
                    >
                        {isSigningIn ? (
                            <span className='h-4 w-4 animate-spin border-2 border-black border-t-transparent' />
                        ) : (
                            <FcGoogle size={19} />
                        )}
                        <span>{isSigningIn ? 'Signing in...' : 'Continue with Google'}</span>
                        {!isSigningIn && <FiArrowRight size={15} />}
                    </motion.button>

                    {errorMessage && (
                        <p role='alert' className='mt-4 border-2 border-black bg-red-100 px-3 py-2 text-center text-xs font-bold text-red-900'>
                            {errorMessage}
                        </p>
                    )}
                </div>

                <div className='flex items-center justify-center gap-2 border-t-2 border-black bg-sky-100 px-4 py-3 text-center'>
                    <FiLock size={12} className='text-sky-950' />
                    <p className='text-[10px] font-bold uppercase tracking-wide text-sky-950'>Secure authentication powered by Firebase</p>
                </div>
            </motion.div>
        </div>
    )
}

export default LoginModel
