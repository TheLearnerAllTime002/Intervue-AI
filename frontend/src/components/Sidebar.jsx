import { AnimatePresence, motion } from "motion/react"
import { GiArtificialHive, GiTwoCoins } from 'react-icons/gi'
import { FiBookmark, FiBriefcase, FiEdit, FiFileText, FiLogOut, FiMail, FiMap, FiPlus, FiSidebar, FiStar } from 'react-icons/fi'
import { useNavigate } from "react-router-dom"
import { FaCirclePlus } from "react-icons/fa6";

const AGENT_ITEMS = [
    {
        icon: <FiFileText size={15} />,
        label: "Resume Builder",
        path: "/resume",
    },
    {
        icon: <FiStar size={15} />,
        label: "Resume Scorer",
        path: "/scorer",
    },
    {
        icon: <FiMap size={15} />,
        label: "Roadmap Builder",
        path: "/roadmap",
    },
    {
        icon: <FiEdit size={15} />,
        label: "Cover Letter",
        path: "/cover-letter",
    },
    {
        icon: <FiBookmark size={15} />,
        label: "Question Banks",
        path: "/question-banks",
    },
];

const WORKSPACE_ITEMS = [
    {
        icon: <FiBriefcase size={15} />,
        label: "Applications",
        path: "/applications",
    },
    {
        icon: <FiMail size={15} />,
        label: "Contact Us",
        path: "/contact",
    },
];

function Sidebar({
    user,
    onNewInterview,
    onLogout,
    sidebarOpen,
    setSidebarOpen,
    moblieOpen,
    setMoblieOpen
}) {
    const navigate = useNavigate()
    const avatar = user?.name ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2) : "U"


    const inner = (
        <div className='flex h-full min-h-0 flex-col'>
            <div className={`px-3 h-[52px] border-b border-black/8 shrink-0 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"
                }`}>
                {sidebarOpen && (
                    <div className='flex items-center gap-2.5'>
                        <div className='w-7 h-7 rounded-lg bg-[#000000] flex items-center justify-center shrink-0 shadow-[0_4px_14px_rgba(0,0,0,0.25)]'><GiArtificialHive size={19} color='#171717' /></div>
                        <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.15 }}
                            className='font-extrabold text-sm tracking-tight text-[#0A0A0A] whitespace-nowrap'>Intervue AI</motion.span>

                    </div>
                )}
                <div className='flex items-center '>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className='cursor-pointer hidden md:flex text-black/30 hover:text-[#0A0A0A] transition-colors shrink-0'>
                        <FiSidebar size={15} />

                    </motion.button>

                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setMoblieOpen(!moblieOpen)}
                        className='cursor-pointer md:hidden  text-black/30 hover:text-[#0A0A0A] transition-colors shrink-0'>
                        <FiSidebar size={15} />

                    </motion.button>
                </div>

            </div>


            <div className='px-2.5 pt-3 pb-1.5 shrink-0'>
                <motion.button
                    onClick={onNewInterview}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`w-full flex items-center gap-2 bg-[#000000] text-white font-semibold rounded-lg py-2 transition-all shadow-[0_4px_14px_rgba(0,0,0,0.25)] cursor-pointer hover:bg-[#1a1a1a] ${sidebarOpen ? "px-2.5 " : "justify-center px-0"
                        }`}>
                    <FiPlus size={14} className='shrink-0' />
                    <AnimatePresence>
                        {sidebarOpen &&
                            <motion.span
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.13 }}
                                className='text-xs whitespace-nowrap'>
                                Create Interview
                            </motion.span>}
                    </AnimatePresence>
                </motion.button>
            </div>
            <nav className='flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2.5'>
                {sidebarOpen && <p className='mx-0.5 mt-2.5 mb-1 inline-flex w-fit items-center border-2 border-black border-l-4 border-l-sky-700 bg-sky-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-sky-950 shadow-[2px_2px_0_#171717]'>Agents</p>}
                {AGENT_ITEMS.map((nav) => (
                    <motion.button key={nav.path}
                        onClick={() => {
                            navigate(nav.path);
                            setMoblieOpen(false)
                        }}
                        whileHover={{ x: sidebarOpen ? 3 : 0 }}
                        transition={{ duration: 0.13 }}
                        className={`flex items-center gap-2.5 rounded-lg py-2 transition-all text-xs font-medium text-black/45 hover:text-[#0A0A0A] hover:bg-black/5 cursor-pointer ${sidebarOpen ? "px-2.5 " : "justify-center px-0"
                            }`}>
                        <span className='shrink-0'>{nav.icon}</span>

                        {sidebarOpen &&
                            <span className='whitespace-nowrap'>{nav.label}
                            </span>}



                    </motion.button>
                ))}

                <div className='my-2 border-t-2 border-black/15' />
                {sidebarOpen && <p className='mx-0.5 mb-1 inline-flex w-fit items-center border-2 border-black bg-yellow-100 px-2 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-black shadow-[2px_2px_0_#171717]'>Workspace</p>}
                {WORKSPACE_ITEMS.map((nav) => (
                    <motion.button key={nav.path}
                        onClick={() => { navigate(nav.path); setMoblieOpen(false) }}
                        whileHover={{ x: sidebarOpen ? 3 : 0 }}
                        transition={{ duration: 0.13 }}
                        className={`flex items-center gap-2.5 rounded-lg py-2 transition-all text-xs font-medium text-black/45 hover:text-[#0A0A0A] hover:bg-black/5 cursor-pointer ${sidebarOpen ? "px-2.5 " : "justify-center px-0"}`}>
                        <span className='shrink-0'>{nav.icon}</span>
                        {sidebarOpen && <span className='whitespace-nowrap'>{nav.label}</span>}
                    </motion.button>
                ))}

            </nav>

            {/* coins */}

            <div className='border-t border-black/8 p-2.5 shrink-0'>
                <motion.button
                    type='button'
                    onClick={() => navigate("/billing")}
                    initial={false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.13 }}
                    aria-label={`Interview coins: ${user?.interviewCoin ?? 0}`}
                    className={`group mb-2.5 flex w-full cursor-pointer items-center rounded-lg border border-white/10 bg-[#000000]/90 py-1.5 text-left shadow-[0_8px_24px_rgba(0,0,0,0.2)] backdrop-blur-2xl transition-all hover:border-white/20 ${sidebarOpen ? "justify-between gap-2.5 px-2.5" : "justify-center gap-1 px-1"}`}>
                    <span className='flex items-center gap-1.5'>
                        <GiTwoCoins size={17} className='shrink-0 text-sky-800' />
                        {sidebarOpen ? (
                            <span className='flex flex-col'>
                                <span className='text-[9px] font-medium uppercase tracking-wider text-white/40'>Interview Coins</span>
                                <span className='text-xs font-bold text-white'>{user?.interviewCoin ?? 0}</span>
                            </span>
                        ) : (
                            <span className='text-xs font-bold text-white'>{user?.interviewCoin ?? 0}</span>
                        )}
                    </span>
                    {sidebarOpen && <FaCirclePlus size={16} className='text-white/70 transition-transform duration-200 group-hover:scale-110' />}
                </motion.button>

                <div className={`flex rounded-lg border-2 border-black bg-sky-100 p-2 ${sidebarOpen ? "items-center gap-2" : "flex-col items-center gap-1"}`}>
                    <div className='w-8 h-8 rounded-full bg-sky-900 flex items-center justify-center shrink-0'>
                        <span className='text-white font-extrabold text-[11px]'>
                            {avatar}

                        </span>
                    </div>

                    <AnimatePresence>
                        {sidebarOpen && (

                            <motion.div initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex-1 min-w-0">
                                <p className="text-black text-xs font-extrabold truncate">
                                    {user?.name ?? "User"}
                                </p>
                                <p className="text-sky-950 text-[10px] font-semibold truncate">
                                    {user?.email ?? "user@email.com"}
                                </p>
                            </motion.div>




                        )}
                    </AnimatePresence>

                    <motion.button
                        type='button'
                        onClick={onLogout}
                        initial={false}
                        animate={{ opacity: 1 }}
                        whileHover={{ scale: 1.15 }}
                        aria-label="Sign out"
                        title="Sign out"
                        className={`cursor-pointer text-black/30 transition-colors hover:text-[#0A0A0A] ${sidebarOpen ? "ml-auto" : ""}`}>
                        <FiLogOut size={13} />
                    </motion.button>
                </div>
            </div>



        </div>
    )
    return (
        <>
            <motion.aside
                animate={{ width: sidebarOpen ? 260 : 72 }}
                transition={{ duration: 0.25, ease: "easeInOut" }}

                className='hidden md:flex fixed top-0 left-0 h-screen bg-white border-r border-black/8 flex-col z-40 overflow-hidden'>
                {inner}
            </motion.aside>

            <AnimatePresence>
                {moblieOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setMoblieOpen(false)}
                        className='fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-sm' />
                )}
            </AnimatePresence>


            <AnimatePresence>
                {moblieOpen && (
                    <motion.aside
                        initial={{ x: -280 }}
                        animate={{ x: 0 }}
                        exit={{ x: -280 }}
                        transition={{ duration: 0.25, ease: "easeInOut" }}
                        className='fixed top-0 left-0 h-screen w-[280px] max-w-[85vw] bg-white border-r border-black/8 flex flex-col z-50 md:hidden overflow-hidden'>
                        {inner}
                    </motion.aside>
                )}
            </AnimatePresence>


        </>
    )
}

export default Sidebar
