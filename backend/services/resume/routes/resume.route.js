import express from "express"

import { generateCoverLetter, getCoverLetterHistory, generateJobMaterials, getResume, matchResumeToJob, uploadResume } from "../controllers/resume.controller.js"
import { createApplication, deleteApplication, listApplications, updateApplication } from "../controllers/application.controller.js"
import { handleResumeUpload } from "../middleware/multer.js"

const resumeRouter = express.Router()


resumeRouter.post("/upload",handleResumeUpload,uploadResume)

resumeRouter.get("/get-resume",getResume)
resumeRouter.post("/match-job",matchResumeToJob)
resumeRouter.post("/cover-letter", generateCoverLetter)
resumeRouter.get("/cover-letter/history", getCoverLetterHistory)
resumeRouter.post("/job-materials",generateJobMaterials)
resumeRouter.get("/applications",listApplications)
resumeRouter.post("/applications",createApplication)
resumeRouter.patch("/applications/:id",updateApplication)
resumeRouter.delete("/applications/:id",deleteApplication)

export default resumeRouter;
