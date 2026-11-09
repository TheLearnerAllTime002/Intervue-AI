import React, { useState } from 'react'
import { FiX } from "react-icons/fi";
import { motion } from "motion/react"
import { FcGoogle } from "react-icons/fc";
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, provider } from '../utils/firebase';
import api from '../utils/axios';
function LoginModel({ onClose ,setUser}) {
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
            const result = await signInWithPopup(auth , provider)
            const token = await result.user.getIdToken()

            const response = await api.post("/api/auth/login" , {token})
          
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
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md px-4'>
            <div className='relative w-full max-w-sm
        bg-[#0A0A0A]/80 backdrop-blur-2xl
        border border-white/10
        rounded-2xl
        overflow-hidden
        shadow-[0_8px_32px_rgba(0,0,0,0.25)]'>

                <div className='absolute inset-0 bg-gradient-to-br from-white/[0.08] via-transparent to-transparent pointer-events-none' />

                <div className='relative p-7'>
                    <button
                        onClick={onClose}
                        className='absolute top-4 right-4
              text-white/30 hover:text-white
              transition-colors'><FiX size={16} /></button>

                    <h2 className='text-lg font-bold text-center mb-2 text-white'>
                        Sign In to {" "}
                        <span className='font-extrabold text-lg tracking-tight text-white'>Intervue AI</span>
                    </h2>
                    <p className='text-white/45 text-center text-xs'>
                        Continue your AI interview journey
                    </p>

                    <div className='mt-7'>
                        <motion.button
                        onClick={handleGoogleAuth}
                            disabled={isSigningIn}
                            aria-busy={isSigningIn}
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.97 }}
                            className='w-full flex items-center justify-center gap-3 py-3 rounded-xl border border-white/15 bg-white/10 backdrop-blur-md hover:border-white/25 hover:bg-white/[0.14] shadow-inner transition-all disabled:cursor-wait disabled:opacity-60'
                        >
                            <FcGoogle size={18}/>
                            <span className='text-white font-medium text-sm'>
                                {isSigningIn ? 'Signing in…' : 'Continue with Google'}
                            </span>


                        </motion.button>
                    </div>
                    {errorMessage && (
                        <p role="alert" className="mt-3 text-center text-xs text-red-300">
                            {errorMessage}
                        </p>
                    )}
                </div>

                <div className='relative border-t border-white/10 bg-black/30 p-4 text-center'>
                <p className='text-white/30 text-xs'>
                Secure authentication powered by Firebase
                </p>
                </div>




            </div>

        </div>
    )
}

export default LoginModel
