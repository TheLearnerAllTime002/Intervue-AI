import { useEffect, useRef } from 'react'
import { useState } from 'react'
import maleVideo from "../../assets/male-ai.mp4"
import femaleVideo from "../../assets/female-ai.mp4"
import { AnimatePresence, motion } from "motion/react"
import { FiArrowRight, FiCamera, FiCameraOff, FiClock, FiCode, FiMessageSquare, FiMic, FiMicOff } from 'react-icons/fi'
import CodeEditor from './CodeEditor'
import Timer from './Timer'
import { submitAnswer } from '../../apis/interview.api'
import { useNavigate } from 'react-router-dom'
function Step2interview({ interviewData, user }) {
const navigate = useNavigate()
  // ── State ──
  const [question, setQuestion] = useState(interviewData.question);
  const [currentIndex, setCurrentIndex] = useState(interviewData.currentQuestion || 0);
  const [answer, setAnswer] = useState("");
  const [speechPreview, setSpeechPreview] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [submitError, setSubmitError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(interviewData.question.timer || 60);
  const [timerActive, setTimerActive] = useState(true); // paused once the answer is submitted

  // UI toggles
  const [micOn, setMicOn] = useState(true); // user's manual preference — only changed by the mic button
  const [cameraOn, setCameraOn] = useState(false);
  const [codeOpen, setCodeOpen] = useState(false);

  // Speech
  const [isAIPlaying, setIsAIPlaying] = useState(false);
  const [subtitle, setSubtitle] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [voiceGender, setVoiceGender] = useState("female");
  const [introSpoken, setIntroSpoken] = useState(false);
  const [speechError, setSpeechError] = useState("");

  // Refs
  const aiVideoRef = useRef(null);
  const userVideoRef = useRef(null);
  const recognitionRef = useRef(null);
  const micOnRef = useRef(micOn);
  const aiPlayingRef = useRef(false);
  const streamRef = useRef(null);
  const submitInFlightRef = useRef(false);


  const videoSource = voiceGender === "female" ? femaleVideo : maleVideo
  const progress = ((currentIndex + 1)/(interviewData.totalQuestions))*100
  const showMicon = micOn && !isAIPlaying

  // Speech recognition
  useEffect(()=>{
    const SpeechRecognition = window.webkitSpeechRecognition || window.SpeechRecognition
    if(!SpeechRecognition) {
      setSpeechError("Speech-to-text is not supported in this browser. Use Chrome or Edge.")
      return
    }

    const rec = new SpeechRecognition()
    rec.lang = "en-US";
    rec.continuous = true;
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e)=>{
      const transcript = e.results[e.results.length - 1][0].transcript
      setAnswer((previousAnswer) => `${previousAnswer} ${transcript}`.trim())
      setSpeechPreview("")
    }
    rec.onerror = (e) => {
      if (["not-allowed", "service-not-allowed", "audio-capture"].includes(e.error)) {
        micOnRef.current = false
        setMicOn(false)
        setSpeechPreview("")
        setSpeechError(
          e.error === "audio-capture"
            ? "No microphone was found. Connect a microphone and try again."
            : "Microphone access was denied. Allow microphone access and enable the mic again."
        )
      }
    }
    recognitionRef.current = rec

    return () => {
      rec.stop()
      recognitionRef.current = null
    }
  },[])

  useEffect(() => () => {
    recognitionRef.current?.stop()
    streamRef.current?.getTracks().forEach((track) => track.stop())
    window.speechSynthesis?.cancel()
  }, [])

  const startMic = ()=>{
    try {
      recognitionRef.current?.start()
      setSpeechError("")
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Could not start speech recognition:", error)
        setSpeechError("Could not start the microphone. Check your browser permission.")
      }
    }
  }

  const stopMic = ()=>{
    try {
      recognitionRef.current?.stop()
    } catch (error) {
      if (error.name !== "InvalidStateError") {
        console.error("Could not stop speech recognition:", error)
      }
    }
  }

  useEffect(() => {
    if (micOn && !isAIPlaying) {
      startMic()
    }
  }, [micOn, isAIPlaying])

  const toggleMic = ()=>{
    if(micOn){
      micOnRef.current = false
      stopMic()
    }else{
      micOnRef.current = true
      startMic()
    }
    setMicOn(!micOn)
  }

  const toggleCamera =async ()=>{
    if(cameraOn){
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setCameraOn(false);

    }else{
      try {
        const stream = await navigator.mediaDevices.getUserMedia({video:true})
        streamRef.current = stream
        setCameraOn(true)
        setTimeout(()=>{
          if(userVideoRef.current) userVideoRef.current.srcObject = stream

        },100)
      } catch {
        setCameraOn(false)
      }
    }
  }

  const handleSubmitCode= (code) => {
   setAnswer((prev)=>{
    const separator = prev.trim() ? "\n\n--- Code ---\n" : "--- Code ---\n";
    return prev + separator + code
   });
   setCodeOpen(false)
    
  }

  useEffect(()=>{
    if (timeLeft <= 0 || !timerActive) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);

  },[timeLeft , timerActive])


  useEffect(()=>{
    const load = ()=>{
      const voices = window.speechSynthesis.getVoices()
      if(!voices.length)return;
      const englishVoices = voices.filter((voice) => /^en([-_]|$)/i.test(voice.lang))
      const candidates = englishVoices.length ? englishVoices : voices
      setAvailableVoices(candidates)
      const naturalVoiceScore = (voice) => {
        const name = voice.name.toLowerCase()
        let score = voice.lang.toLowerCase() === "en-us" ? 30 : 0
        if (/natural|neural|online|premium|enhanced/.test(name)) score += 100
        if (/google/.test(name)) score += 70
        if (/aria|jenny|samantha|ava|sonia|joanna|zira|karen|tessa|victoria/.test(name)) score += 25
        if (/desktop|compact/.test(name)) score -= 10
        return score
      }
      const bestVoice = [...candidates].sort((a, b) => naturalVoiceScore(b) - naturalVoiceScore(a))[0]
      setSelectedVoice(bestVoice)
      setVoiceGender(detectGender(bestVoice))
    }
    load()
    window.speechSynthesis.addEventListener("voiceschanged", load)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load)

  },[])

  const speakText = (text)=>
    new Promise((resolve)=>{
      if (!window.speechSynthesis || !selectedVoice || !text?.trim()) { resolve(); return; }

      window.speechSynthesis.cancel()

      setTimeout(()=>{
        const utter = new SpeechSynthesisUtterance(text.replace(/\s+/g, " ").trim())
        utter.voice  = selectedVoice;
        utter.rate   = 1;
        utter.pitch  = 1;
        utter.volume = 1;
        utter.onstart=()=>{
          aiPlayingRef.current = true
          setIsAIPlaying(true)
          stopMic()
          aiVideoRef.current?.play()
        }
        utter.onend=()=>{
          aiPlayingRef.current = false
          aiVideoRef.current?.pause()
          setIsAIPlaying(false)
          if(micOnRef.current) startMic()
          setTimeout(()=>{ setSubtitle("");resolve() },300)
        }
        setSubtitle(text)
        window.speechSynthesis.speak(utter)
      },150)
    
    })

  const detectGender = (voice) => {
    const n = voice.name.toLowerCase()
    if (/\bmale\b|\bman\b|david|mark|guy|matthew|ryan|daniel|james|thomas|george|arthur|rishi|reed|liam|aaron|eric|brian|christopher|steffan|noel|eddy|carlos|diego|jorge|juan|miguel|paulo|antonio|viktor|ruslan|dmitri|yuri|ali|omar|hassan/.test(n)) return "male"
    return "female"
  }

  const changeVoice = (event) => {
    const voice = availableVoices[Number(event.target.value)]
    if (!voice) return
    window.speechSynthesis.cancel()
    aiPlayingRef.current = false
    setIsAIPlaying(false)
    setSelectedVoice(voice)
    setVoiceGender(detectGender(voice))
  }
  

  useEffect(()=>{
    if(!selectedVoice || introSpoken)return;
    const runIntro=async () => {
      setIntroSpoken(true)
      await new Promise((r) => setTimeout(r, 1200));
      await speakText(`Welcome ${user?.name?.split(" ")[0] || "there"}! Let's begin your interview.`);
      await new Promise((r) => setTimeout(r, 900));
      await speakText(interviewData.question.question);
    }
    runIntro()

  },[selectedVoice])


  useEffect(()=>{
    if(!selectedVoice || !introSpoken)return;
    const speakQuestion = async () => {
      await new Promise((r) => setTimeout(r, 900));
      await speakText(question.question);
    }
    speakQuestion()

  },[question])

  useEffect(()=>{
    if(timeLeft !== 0)return;
    submitAnswerNow(answer.trim() || "No answer provided. Time over.")

  },[timeLeft])

  async function submitAnswerNow(finalAnswer) {
    if (submitInFlightRef.current || !finalAnswer.trim()) return

    submitInFlightRef.current = true
    setTimerActive(false)
    setLoading(true)
    setSubmitError("")

    try {
      const res = await submitAnswer({ interviewId: interviewData.interviewId, answer: finalAnswer })
      if (!res?.success) {
        throw new Error(res?.message || "The interview service returned an empty response.")
      }

      setFeedback(res.feedback)

      if (res.completed) {
        navigate(`/interview/${interviewData.interviewId}/report`)
        return
      }

      if (res.question) {
        setQuestion(res.question)
        setCurrentIndex(res.currentQuestion)
        setAnswer("")
        setTimeLeft(res.question.timer || 60)
        setTimerActive(true)
        submitInFlightRef.current = false
      }
    } catch (error) {
      console.error("Could not submit interview answer:", error)
      setSubmitError(error.response?.data?.message || error.message || "Could not submit your answer. Please try again.")
    } finally {
      setLoading(false)
      submitInFlightRef.current = false
    }
  }

  const submit = () => submitAnswerNow(answer.trim())

  


  return (
    <div className='min-h-screen bg-white flex items-center justify-center p-3 sm:p-5'>


      <CodeEditor open={codeOpen} onClose={() => setCodeOpen(false)} onSubmitCode={handleSubmitCode} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className='w-full max-w-5xl bg-[#0E1016] border border-white/10 rounded-2xl sm:rounded-[24px] overflow-hidden shadow-[0_0_60px_rgba(255,255,255,.03)] grid lg:grid-cols-[36%_64%]'>
        {/* left */}

        <div className='flex flex-col border-b lg:border-b-0 lg:border-r border-white/8 p-4 sm:p-5 gap-3'>

          {/* Ai Video */}
          <div className='relative rounded-xl overflow-hidden bg-black aspect-video'>
            <video
              src={videoSource}
              ref={aiVideoRef}
              muted
              playsInline
              preload="auto"
              loop
              className="w-full h-full object-cover"
            />
            {isAIPlaying && (
              <div className='absolute bottom-2 left-2 flex items-center gap-1.5 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1'>
                <div className='flex gap-0.5 items-end h-3'>
                  {[1, 2, 3].map(i => (
                    <motion.div
                      key={i}
                      className="w-0.5 bg-white rounded-full"
                      animate={{ height: ["4px", "12px", "4px"] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
                <span className='text-[10px] text-white/80'>AI Speaking</span>
              </div>
            )}
          </div>

          <div className='min-h-[52px] flex items-center'>
            <AnimatePresence>
              {subtitle &&
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className='w-full rounded-xl bg-white/5 border border-white/8 px-3 py-2'>
                  <p className="text-xs text-white/65 leading-relaxed text-center">{subtitle}</p>

                </motion.div>}

             
            </AnimatePresence>

            
          </div>


          <div className='relative rounded-xl overflow-hidden bg-[#17181E] border border-white/8 aspect-video flex items-center justify-center'>
            {cameraOn ?
              <>
                <video
                  ref={userVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
                <div className='absolute top-2 left-2 bg-black/60 backdrop-blur-sm rounded-full px-2 py-0.5'>
                <span className="text-[10px] text-white/70">You</span>
                </div>
              </>
              :
              <div className='flex flex-col items-center gap-2'>
                <div className='w-14 h-14 rounded-full bg-white/10 border border-white/15 flex items-center justify-center'>
                <span className='text-2xl font-bold text-white'>{user?.name?.charAt(0)?.toUpperCase() || "?"}</span>
                </div>
                <span className='text-xs text-white/35'>{user?.name?.split(" ")[0] || "You"}</span>
                </div>}     
          </div>


          <div className='flex flex-col items-center gap-1.5 pt-1'>
            <div className='flex items-center justify-center gap-3'>
              <motion.button
              onClick={toggleMic} 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.93 }}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  showMicon ? "bg-white/10 border-white/15 text-white" : "bg-red-500/20 border-red-500/30 text-red-400"
                }`}>
                  {showMicon ? <FiMic size={15}/> : <FiMicOff size={15}/>}

              </motion.button>

              <motion.button 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.93 }}
              onClick={toggleCamera}
              className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all ${
                  cameraOn ? "bg-white/10 border-white/15 text-white" : "bg-white/5 border-white/10 text-white/45 hover:text-white/70"
                }`}>
                  {cameraOn ? <FiCamera size={15}/> : <FiCameraOff size={15}/>}
                

              </motion.button>

              <motion.button 
              whileHover={{ scale: 1.08 }} 
              whileTap={{ scale: 0.93 }}
              onClick={()=>setCodeOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center border bg-white/5 border-white/10 text-white/45 hover:text-white/70 hover:border-white/20 transition-all">

                <FiCode size={15}/>
                
              </motion.button>


            </div>

            <div className='min-h-[14px] flex items-center justify-center'>
              {micOn && isAIPlaying && (
                <span className="text-[10px] text-red-400/80">Mic paused — AI is speaking</span>)}
              {speechError && !isAIPlaying && (
                <span role="alert" className="text-center text-[10px] text-red-400/90">{speechError}</span>
              )}
            </div>

            <span className="text-[10px] text-white/35 text-center">
              Coding question? Use <FiCode size={9} className="inline -mt-0.5" /> to write &amp; add code
            </span>

            {availableVoices.length > 0 && (
              <label className="flex w-full max-w-xs items-center gap-2 text-[10px] font-semibold text-white/50">
                <span className="shrink-0">AI Voice</span>
                <select
                  aria-label="AI voice"
                  value={Math.max(0, availableVoices.findIndex((v) => v.voiceURI === selectedVoice?.voiceURI))}
                  onChange={changeVoice}
                  className="min-w-0 flex-1 rounded-lg bg-white/10 border border-white/10 px-2 py-1 text-[11px] text-white outline-none"
                >
                  <optgroup label="Female">
                    {availableVoices.map((v, i) => detectGender(v) === "female" && (
                      <option key={`${v.voiceURI}-${i}`} value={i}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                  <optgroup label="Male">
                    {availableVoices.map((v, i) => detectGender(v) === "male" && (
                      <option key={`${v.voiceURI}-${i}`} value={i}>{v.name} ({v.lang})</option>
                    ))}
                  </optgroup>
                </select>
              </label>
            )}

          </div>

        </div>
        {/* right */}

        <div className='flex flex-col p-4 sm:p-6'>


          <div className='flex items-start justify-between mb-4'>

            <div> 
              <h2 className='text-base sm:text-lg font-semibold text-white'>
                AI Interview
              </h2>
              <div className='flex items-center gap-2 text-zinc-500 text-xs mt-0.5'>
                <FiClock size={11}/>
                <span>{question.difficulty}</span>
                <span>·</span>
                <span className='capitalize'>{interviewData.difficultyMode?.replace("-", " ") || "intermediate"}</span>
                {interviewData.companyName && <span>· {interviewData.companyName}</span>}

              </div>
            </div>

            <div className='flex flex-col items-end gap-1.5 min-w-[110px]'>
              <Timer timeLeft={timeLeft} totalTime={question.timer || 60}/>

            </div>
          </div>


          <motion.div 
          initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          className='relative overflow-hidden rounded-xl bg-[#17181E] border border-white/8 p-4 sm:p-5 mb-4'>
            <div className='absolute inset-0 bg-gradient-to-br from-white/[0.04] via-transparent to-transparent pointer-events-none'/>
            <div className='relative flex items-center gap-2.5 mb-3'>
              <div className='w-8 h-8 rounded-lg bg-white text-black flex items-center justify-center shrink-0'>
                <FiMessageSquare size={14}/>
              </div>
              <p className='text-xs text-zinc-500'>Question {currentIndex + 1}</p>
            </div>
            <p className='relative text-white text-sm sm:text-base leading-7'>
              {question.question}</p>

          </motion.div>

          <div className='mb-3'>
            <div className='flex justify-between text-[10px] text-white/35 mb-1'>
            <span>Progress</span>
            <span>{currentIndex+1}/{interviewData.totalQuestions}</span>
            </div>
            <div className='w-full h-1 rounded-full bg-white/10 overflow-hidden'>
            <div className='h-full bg-white rounded-full transition-all duration-500' style={{width: `${progress}%`}} /></div>
          </div>

          <div className='flex-1 flex flex-col min-h-0'>
            <label className='text-xs font-medium text-zinc-400 mb-1.5'>Your Answer</label>
            <textarea
            onChange={(e)=>{ setSpeechPreview(""); setAnswer(e.target.value); setFeedback(null); setSubmitError("") }}
            value={speechPreview ? `${answer}${answer.trim() ? " " : ""}${speechPreview}` : answer}
            rows={5}
            onKeyDown={(e)=>{if(e.ctrlKey && e.key === "Enter") submit()}}
            placeholder='Write your answer here… or speak if mic is on'
             className='flex-1 w-full rounded-xl bg-[#17181E] border border-white/8 p-4 text-sm text-white outline-none resize-none focus:border-white/25 transition placeholder-white/20'/>
          </div>

          <div className='mt-3 min-h-[0px]'>
            <AnimatePresence>
              {feedback && (
                <motion.div 
                initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 ,y:6}}
                className='rounded-lg border-2 border-black bg-sky-100 p-4 max-h-40 overflow-y-auto'>
                  <p className='inline-block border-2 border-black bg-white px-2 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-950 mb-2'>AI Feedback</p>
                  <p className='text-sm font-medium text-black leading-6'>{feedback.feedback}</p>

                </motion.div>)}
            </AnimatePresence>
          </div>


          <div className='flex items-center justify-between mt-4 pt-3 border-t border-white/8'>
          <span className='text-xs text-zinc-600 hidden sm:block'>
            Press{" "}
            <span className='mx-1 rounded bg-white/10 px-1.5 py-0.5 text-white text-[10px]'>
             Ctrl+Enter
            </span>to Submit
          </span>

          {submitError && <p role="alert" className="mr-3 text-xs font-bold text-red-700">{submitError}</p>}

          <motion.button 
          whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={submit}
              disabled={loading || !answer.trim()}
              className='ml-auto h-10 min-w-[150px] justify-center px-5 rounded-xl bg-white text-black text-sm font-semibold flex items-center gap-2 disabled:opacity-40 transition'

              
              >
                 {loading ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-black border-t-transparent animate-spin" />
                  Submitting…
                </>
              ) : (
                <>{submitError ? "Retry Answer" : "Submit Answer"} <FiArrowRight size={15} /></>
              )}

          </motion.button>
          
          </div>


        </div>


      </motion.div>



    </div>
  )
}

export default Step2interview
