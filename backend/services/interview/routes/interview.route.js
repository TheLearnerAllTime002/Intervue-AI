import express from "express"
import { deleteInterview, getAllInterviews, getInterview, getPeerBenchmark, startInterview, submitAnswer } from "../controllers/interview.controller.js"
import { addBankQuestion, createQuestionBank, deleteBankQuestion, deleteQuestionBank, getQuestionBanks } from "../controllers/questionBank.controller.js"

const interviewRouter = express.Router()

interviewRouter.post("/start",startInterview)

interviewRouter.post("/answer",submitAnswer)
interviewRouter.get("/all",getAllInterviews)
interviewRouter.get("/benchmark", getPeerBenchmark)
interviewRouter.get("/banks", getQuestionBanks)
interviewRouter.post("/banks", createQuestionBank)
interviewRouter.post("/banks/:id/questions", addBankQuestion)
interviewRouter.delete("/banks/:id/questions/:questionId", deleteBankQuestion)
interviewRouter.delete("/banks/:id", deleteQuestionBank)
interviewRouter.delete("/:id",deleteInterview)

interviewRouter.get("/:id",getInterview)


export default interviewRouter
