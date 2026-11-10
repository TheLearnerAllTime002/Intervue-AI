const MAX_RESUME_SIZE = 20 * 1024 * 1024

export const validateResumeFile = async (file) => {
  if (!file) return "Choose a PDF file to continue."
  if (file.size <= 0) return "The selected file is empty. Choose another PDF."
  if (file.size > MAX_RESUME_SIZE) return "The PDF is too large. The maximum size is 20 MB."
  if (!file.name?.toLowerCase().endsWith(".pdf")) return "Only PDF files are supported."
  if (file.type && file.type !== "application/pdf") return "This file does not appear to be a PDF. Choose a PDF file."

  try {
    const headerBytes = new Uint8Array(await file.slice(0, 1024).arrayBuffer())
    const header = new TextDecoder("ascii").decode(headerBytes)
    if (!header.includes("%PDF-")) return "The file contents are not a valid PDF. Choose another file."
  } catch {
    return "The selected file could not be checked. Please choose it again."
  }

  return ""
}

export const formatFileSize = (bytes) => {
  if (!Number.isFinite(bytes) || bytes < 0) return ""
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
