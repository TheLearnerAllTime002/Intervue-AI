import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from "motion/react"
import { FiCopy, FiRotateCcw, FiTerminal, FiX } from 'react-icons/fi'
import Editor from '@monaco-editor/react'

const LANG_OPTIONS = ["javascript", "python", "java", "cpp"];

const DEFAULT_CODE = {
  javascript: `// Write your solution here
function solution() {
  // your code
}`,
  python: `# Write your solution here
def solution():
    pass`,
  java: `// Write your solution here
public class Solution {
    public static void main(String[] args) {
        // your code
    }
}`,
  cpp: `// Write your solution here
#include <iostream>
using namespace std;

int main() {
    // your code
    return 0;
}`,
};

function CodeEditor({ open, onClose, onSubmitCode }) {
  const [lang, setLang] = useState("javascript")
  const [drafts, setDrafts] = useState(DEFAULT_CODE)
  const [copyMessage, setCopyMessage] = useState("")
  const codeRef = useRef(drafts.javascript)
  const code = drafts[lang]

  useEffect(() => {
    if (!open) return undefined
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [open, onClose])

  const changeLanguage = (nextLanguage) => {
    setLang(nextLanguage)
    codeRef.current = drafts[nextLanguage]
    setCopyMessage("")
  }

  const updateCode = (value) => {
    const nextCode = value ?? ""
    codeRef.current = nextCode
    setDrafts((current) => ({ ...current, [lang]: nextCode }))
  }

  const submitCode = () => {
    if (codeRef.current.trim()) onSubmitCode?.(codeRef.current)
  }

  const handleEditorMount = (editor, monaco) => {
    editor.focus()
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, submitCode)
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopyMessage("Copied")
      window.setTimeout(() => setCopyMessage(""), 1600)
    } catch {
      setCopyMessage("Clipboard unavailable")
      window.setTimeout(() => setCopyMessage(""), 2200)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
            className='fixed inset-0 z-50 bg-sky-950/55 backdrop-blur-sm'
          />

          <motion.div
            role='dialog'
            aria-modal='true'
            aria-labelledby='code-editor-title'
            initial={{ opacity: 0, scale: 0.97, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.2 }}
            className='fixed inset-x-3 top-4 bottom-4 sm:inset-x-6 sm:top-6 sm:bottom-6 md:inset-x-10 md:top-8 md:bottom-8 z-50 flex flex-col overflow-hidden border-2 border-black bg-[var(--neo-paper)] shadow-[8px_8px_0_#171717]'
          >
            <header className='flex flex-col gap-3 border-b-2 border-black bg-sky-100 px-3 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-5'>
              <div className='flex items-center gap-2.5'>
                <div className='flex h-9 w-9 items-center justify-center border-2 border-black bg-sky-300'>
                  <FiTerminal className='text-sky-950' size={17} />
                </div>
                <div>
                  <h2 id='code-editor-title' className='text-sm font-black text-black'>Code editor</h2>
                  <p className='text-[10px] font-semibold text-sky-950'>Keep a draft for each language</p>
                </div>
              </div>

              <div className='flex items-center justify-between gap-2 sm:ml-auto sm:justify-end'>
                <nav aria-label='Programming language' className='flex min-w-0 gap-2 overflow-x-auto'>
                  {LANG_OPTIONS.map((language) => (
                    <button
                      key={language}
                      type='button'
                      aria-pressed={lang === language}
                      onClick={() => changeLanguage(language)}
                      className='code-language-tab shrink-0 px-3 py-1.5 text-xs capitalize'
                    >
                      {language === "cpp" ? "C++" : language}
                    </button>
                  ))}
                </nav>

                <button type='button' onClick={onClose} aria-label='Close code editor' className='code-editor-close flex h-9 w-9 shrink-0 items-center justify-center'>
                  <FiX size={18} />
                </button>
              </div>
            </header>

            <div className='flex min-h-0 flex-1 flex-col bg-[#101820]'>
              <div className='flex items-center justify-between border-b border-white/15 bg-[#101820] px-3 py-2 text-xs text-white sm:px-4'>
                <span className='font-mono font-semibold'>{lang === "cpp" ? "main.cpp" : lang === "javascript" ? "solution.js" : lang === "python" ? "solution.py" : "Solution.java"}</span>
                <div className='flex items-center gap-3'>
                  <span className='hidden text-white/70 sm:inline'>{code.split("\n").length} lines</span>
                  <button type='button' onClick={copyCode} className='code-editor-utility flex items-center gap-1.5 px-2 py-1 text-[10px]'>
                    <FiCopy size={12} /> {copyMessage || "Copy"}
                  </button>
                  <button type='button' onClick={() => updateCode(DEFAULT_CODE[lang])} className='code-editor-utility flex items-center gap-1.5 px-2 py-1 text-[10px]'>
                    <FiRotateCcw size={12} /> Reset
                  </button>
                </div>
              </div>

              <div className='min-h-0 flex-1'>
                <Editor
                  height='100%'
                  language={lang}
                  value={code}
                  onChange={updateCode}
                  onMount={handleEditorMount}
                  theme='vs-dark'
                  loading={<div className='flex h-full items-center justify-center text-sm font-semibold text-white'>Loading code editor...</div>}
                  options={{
                    ariaLabel: `${lang} code editor`,
                    fontSize: 14,
                    minimap: { enabled: false },
                    lineNumbers: "on",
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    padding: { top: 16, bottom: 16 },
                    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
                    fontLigatures: true,
                    renderLineHighlight: "line",
                    cursorBlinking: "smooth",
                    automaticLayout: true,
                    tabSize: lang === "python" ? 4 : 2,
                    insertSpaces: true,
                    autoClosingBrackets: "always",
                    autoClosingQuotes: "always",
                    suggestOnTriggerCharacters: true,
                    quickSuggestions: true,
                    formatOnPaste: true,
                    formatOnType: true,
                  }}
                />
              </div>

            </div>

            <footer className='flex flex-wrap items-center justify-between gap-3 border-t-2 border-black bg-sky-100 px-3 py-3 sm:px-5'>
              <p className='text-[10px] font-semibold text-sky-950'>Ctrl/Cmd + Enter: add code to your answer.</p>
              <div className='ml-auto flex flex-wrap items-center gap-2'>
                <button type='button' onClick={submitCode} disabled={!code.trim()} className='code-editor-primary flex items-center justify-center px-4 py-2 text-xs'>
                  Add code to answer
                </button>
              </div>
            </footer>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export default CodeEditor
