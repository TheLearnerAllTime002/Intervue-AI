

// pdf  ---->  pdf Storage  ---> text ---> llm ---> agent ---> promt ---> data ---> save mongoDb ---> redis -->pdf delete ---> resume data ( score , missing skills , recommen.)

import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import { jobMatchAgent } from "../agents/jobMatch.agent.js";
import { jobMaterialsAgent } from "../agents/jobMaterials.agent.js";
import { coverLetterAgent } from "../agents/coverLetter.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs"


export const uploadResume = async (req,res) => {
    let file;
    let stage = "validating the uploaded PDF";
    try {
        file = req.file;
        if(!file){
            return res.status(400).json({
                success:false,
                message:"Resume PDF is required"
            })
        }
        const descriptor = fs.openSync(file.path, "r")
        const headerBytes = Buffer.alloc(1024)
        let headerLength = 0
        try {
            headerLength = fs.readSync(descriptor, headerBytes, 0, headerBytes.length, 0)
        } finally {
            fs.closeSync(descriptor)
        }
        if (!headerBytes.subarray(0, headerLength).includes(Buffer.from("%PDF-"))) {
            fs.unlinkSync(file.path)
            return res.status(400).json({ success: false, message: "The file contents are not a valid PDF." })
        }
        const userId = req.headers["x-user-id"];

          if(!userId){
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path)
            return res.status(400).json({
                success:false,
                message:"UserId is required"
            })
        }

        stage = "extracting text from the PDF";
        let resumeText;
        try {
            resumeText = await extractText(file.path)
        } catch (error) {
            console.warn("Resume PDF extraction failed:", error.message)
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path)
            return res.status(422).json({
                success: false,
                message: "We couldn't read this PDF. Try exporting it again as a standard PDF and upload it once more.",
            })
        }
        if (typeof resumeText !== "string" || resumeText.trim().length < 40) {
            if (file?.path && fs.existsSync(file.path)) fs.unlinkSync(file.path)
            return res.status(422).json({
                success: false,
                message: "This PDF has too little selectable text to analyze. If it is scanned, run OCR and upload a searchable PDF.",
            })
        }

        stage = "analyzing the resume";
        const aiResponse = await resumeAgent(resumeText.slice(0, 40000))

        const resumeData = aiResponse

        stage = "saving the resume analysis";
        let resume = await Resume.findOne({userId})

        if(resume){
            Object.assign(resume,{
                ...resumeData,
                extractedText:resumeText

            }    
            )
            await resume.save()
        }else{
            resume = await Resume.create({
                userId,
                extractedText:resumeText,
                ...resumeData
            })
        }

        if (redis.status === "ready") {
            try {
                await redis.set(`resume:${userId}`, JSON.stringify(resume))
            } catch (cacheError) {
                console.warn("Resume saved, but Redis cache update failed:", cacheError.message)
            }
        }

        if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }

        return res.status(200).json({
            success:true,
            message:"Resume analyzed successfully",
            data:resume
        })

        
    } catch (error) {
        console.error("Resume upload failed:", {
            stage,
            errorName: error.name,
            errorCode: error.code,
            providerStatus: error.status ?? error.response?.status,
            message: error.message,
        })

        if (file?.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
        }
        const providerStatus = error.status ?? error.response?.status ?? error.cause?.status ?? error.cause?.response?.status
        const diagnostic = process.env.NODE_ENV === "production"
            ? undefined
            : error.message?.slice(0, 240)
        const isAiFailure = stage === "analyzing the resume"
        const message = isAiFailure
            ? providerStatus === 429
                ? "The resume analyzer is temporarily rate-limited. Please wait a moment and try again."
                : providerStatus === 401 || providerStatus === 403
                    ? "The resume analyzer is not authorized. Check GROQ_API_KEY in the resume service environment."
                    : diagnostic
                        ? `Resume analysis failed: ${diagnostic}`
                        : "Resume text was extracted, but AI analysis failed. Check Groq availability and the resume service logs."
            : "The resume could not be saved. Check the resume service logs and try again."
        return res.status(isAiFailure ? 502 : 500).json({
            success:false,
            message,
        })
        
    }
}


export const getResume = async (req,res) => {
    try {
        const userId = req.headers["x-user-id"];

    if (redis.status === "ready") {
        try {
            const cache = await redis.get(`resume:${userId}`)
            if (cache) {
                return res.status(200).json({ success: true, source: "redis", data: JSON.parse(cache) })
            }
        } catch (cacheError) {
            console.warn("Resume cache read failed; falling back to MongoDB:", cacheError.message)
        }
    }
    const resume = await Resume.findOne({userId})

    if(!resume){
        return res.status(200).json({
            success:true,
            data:null
        })
    }

    if (redis.status === "ready") {
        try {
            await redis.set(`resume:${userId}`, JSON.stringify(resume))
        } catch (cacheError) {
            console.warn("Resume loaded from MongoDB, but Redis cache update failed:", cacheError.message)
        }
    }
   

     return res.status(200).json({
            success:true,
            source:"mongoDb",
            data:resume
        })
        
    } catch (error) {
        console.log(error)
         return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
    


}

export const matchResumeToJob = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const jobDescription = req.body?.jobDescription;

        if (!userId) {
            return res.status(401).json({ success: false, message: "Sign in to match your resume." });
        }
        if (typeof jobDescription !== "string" || jobDescription.trim().length < 40) {
            return res.status(400).json({ success: false, message: "Paste a job description with at least 40 characters." });
        }
        if (jobDescription.length > 18000) {
            return res.status(413).json({ success: false, message: "Job descriptions must be 18,000 characters or fewer." });
        }

        const resume = await Resume.findOne({ userId }).select("extractedText");
        if (!resume?.extractedText) {
            return res.status(404).json({ success: false, message: "Upload and analyze a resume before matching it to a job." });
        }

        const match = await jobMatchAgent({
            resumeText: resume.extractedText,
            jobDescription: jobDescription.trim(),
        });

        return res.status(200).json({ success: true, data: match });
    } catch (error) {
        console.error("Resume to job matching failed:", error.message);
        return res.status(500).json({
            success: false,
            message: "Could not match your resume right now. Please try again.",
        });
    }
};

export const generateCoverLetter = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const { jobDescription, company = "", role = "", tone = "professional", length = "standard", resumeText: rawResumeText = "" } = req.body ?? {}

        if (!userId) return res.status(401).json({ success: false, message: "Sign in to generate a cover letter." })
        if (typeof jobDescription !== "string" || jobDescription.trim().length < 40 || jobDescription.length > 18000) {
            return res.status(400).json({ success: false, message: "Provide a job description between 40 and 18,000 characters." })
        }
        if (!["professional", "enthusiastic", "formal"].includes(tone)) {
            return res.status(400).json({ success: false, message: "Tone must be professional, enthusiastic, or formal." })
        }
        if (!["concise", "standard", "detailed"].includes(length)) {
            return res.status(400).json({ success: false, message: "Length must be concise, standard, or detailed." })
        }

        // Use pasted resume text if provided, otherwise fall back to stored resume
        let resumeText = ""
        if (typeof rawResumeText === "string" && rawResumeText.trim().length >= 40) {
            resumeText = rawResumeText.trim().slice(0, 14000)
        } else {
            const resume = await Resume.findOne({ userId }).select("extractedText")
            if (!resume?.extractedText) {
                return res.status(404).json({ success: false, message: "No resume found. Upload a resume or paste your resume text." })
            }
            resumeText = resume.extractedText
        }

        const result = await coverLetterAgent({
            resumeText,
            jobDescription: jobDescription.trim(),
            company: String(company).trim().slice(0, 160),
            role: String(role).trim().slice(0, 160),
            tone,
            length,
        })

        // Save to history (keep last 20, newest first)
        const historyEntry = {
            coverLetter: result.coverLetter,
            subject: result.subject,
            role: String(role).trim().slice(0, 160),
            company: String(company).trim().slice(0, 160),
            tone,
            length,
            createdAt: new Date(),
        }
        await Resume.findOneAndUpdate(
            { userId },
            { $push: { coverLetterHistory: { $each: [historyEntry], $slice: -20 } } },
            { upsert: false }
        )

        return res.status(200).json({ success: true, data: result })
    } catch (error) {
        console.error("Cover letter generation failed:", error.message)
        return res.status(500).json({ success: false, message: "Could not generate the cover letter right now. Please try again." })
    }
}

export const getCoverLetterHistory = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        if (!userId) return res.status(401).json({ success: false, message: "Sign in to view your history." })
        const resume = await Resume.findOne({ userId }).select("coverLetterHistory")
        const history = (resume?.coverLetterHistory || []).slice().reverse()
        return res.status(200).json({ success: true, data: history })
    } catch (error) {
        console.error("Cover letter history fetch failed:", error.message)
        return res.status(500).json({ success: false, message: "Could not load cover letter history." })
    }
}

export const generateJobMaterials = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { jobDescription, company = "", role = "" } = req.body ?? {};
        if (!userId) {
            return res.status(401).json({ success: false, message: "Sign in to tailor your application materials." });
        }
        if (typeof jobDescription !== "string" || jobDescription.trim().length < 40 || jobDescription.length > 18000) {
            return res.status(400).json({ success: false, message: "Provide a job description between 40 and 18,000 characters." });
        }
        if (typeof company !== "string" || typeof role !== "string") {
            return res.status(400).json({ success: false, message: "Company and role must be text." });
        }

        const resume = await Resume.findOne({ userId }).select("extractedText");
        if (!resume?.extractedText) {
            return res.status(404).json({ success: false, message: "Upload and analyze a resume before tailoring it." });
        }
        const materials = await jobMaterialsAgent({
            resumeText: resume.extractedText,
            jobDescription: jobDescription.trim(),
            company: company.trim(),
            role: role.trim(),
        });
        return res.status(200).json({ success: true, data: materials });
    } catch (error) {
        console.error("Job application material generation failed:", error.message);
        return res.status(500).json({ success: false, message: "Could not generate application materials right now. Please try again." });
    }
};
