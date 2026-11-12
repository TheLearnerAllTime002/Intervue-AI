import mongoose from "mongoose";
import { getRedisClient } from "../../../shared/redis/redis.js";

const redis = getRedisClient("interview");
import graph from "../graph/graph.js";
import Interview from "../models/interview.model.js";


export const startInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const {
            type,
            role,
            difficultyMode = "intermediate",
            companyName = "",
            useResume = false,
            resume = {}, } = req.body;

        const difficultyModes = ["beginner", "intermediate", "advanced", "company-specific"];
        if (!userId || !["hr", "technical"].includes(type) || typeof role !== "string" || !role.trim()) {
            return res.status(400).json({
                success: false,
                message: "Interview type and role are required",
            });
        }
        if (!difficultyModes.includes(difficultyMode)) {
            return res.status(400).json({ success: false, message: "Choose a valid interview difficulty." });
        }
        if (typeof companyName !== "string" || companyName.length > 120) {
            return res.status(400).json({ success: false, message: "Company name must be 120 characters or fewer." });
        }
        if (difficultyMode === "company-specific" && !companyName.trim()) {
            return res.status(400).json({ success: false, message: "Enter a company for company-specific practice." });
        }

        const result = await graph.invoke({
            action: "start",
            role,
            type,
            difficultyMode,
            companyName: companyName.trim(),
            useResume,
            resume
        })

        const questions = result.questions;

        if (!questions || questions.length === 0) {
            return res.status(500).json({
                success: false,
                message: "Failed to generate interview questions",
            });
        }

        const interview = await Interview.create({
            userId,

            type,

            role,

            difficultyMode,

            companyName: companyName.trim(),

            useResume,

            questions,

            currentQuestion: 0,

            status: "in-progress",
        })

        await redis.del(`interviews:${userId}`)

        return res.status(200).json({
            success: true,

            interviewId: interview._id,

            currentQuestion: 0,

            totalQuestions: interview.questions.length,

            difficultyMode: interview.difficultyMode,

            companyName: interview.companyName,

            question: interview.questions[0],
        })
    } catch (error) {

        console.log(error)

        return res.status(500).json({

            success: false,

            message: error.message,

        });
    }
}


export const submitAnswer = async (req, res) => {
    let claimedInterviewId;
    let claimedUserId;
    try {
        const userId = req.headers["x-user-id"]
        const { interviewId, answer } = req.body

        if (
            !mongoose.isValidObjectId(interviewId) ||
            typeof answer !== "string" ||
            !answer.trim()
        ) {
            return res.status(400).json({
                success: false,
                message: "Interview Id and Answer are required",
            });
        }

        const interview = await Interview.findOneAndUpdate(
            {
                _id: interviewId,
                userId,
                status: "in-progress",
                submissionInProgress: { $ne: true },
            },
            { $set: { submissionInProgress: true } },
            { new: true }
        )

        if (!interview) {
            const existing = await Interview.findOne({ _id: interviewId, userId }).select("status submissionInProgress");
            if (existing?.submissionInProgress) {
                return res.status(409).json({ success: false, message: "An answer is already being processed" });
            }
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }
        claimedInterviewId = interviewId;
        claimedUserId = userId;

        if (interview.status === "completed") {
            return res.status(400).json({
                success: false,
                message: "Interview already completed",
            });
        }

        const index = interview.currentQuestion
        const currentQuestion = interview.questions[index]

        if (!currentQuestion) {
            interview.submissionInProgress = false;
            await interview.save();
            return res.status(400).json({
                success: false,
                message: "Invalid question index",
            });
        }

        currentQuestion.userAnswer = answer;
        currentQuestion.answeredAt = new Date();

        const completed = interview.currentQuestion + 1 >=
            interview.questions.length;

        const result = await graph.invoke({
            action: "feedback",

            question: currentQuestion.question,

            answer,

            difficulty: currentQuestion.difficulty,

            completed,

            role: interview.role,

            type: interview.type,

            questions: interview.questions,
            askedQuestions: interview.questions
                .slice(0, index + 1)
                .map((item) => item.question),
        })


        currentQuestion.feedback = result.feedback;

        if (
            !completed &&
            typeof result.nextQuestion?.question === "string" &&
            result.nextQuestion.question.trim() &&
            interview.questions[index + 1]
        ) {
            const followUp = result.nextQuestion;
            const difficulty = ["easy", "medium", "hard"].includes(followUp.difficulty)
                ? followUp.difficulty
                : "medium";
            const timer = Number.isFinite(Number(followUp.timer))
                ? Math.min(300, Math.max(60, Math.round(Number(followUp.timer))))
                : 90;

            interview.questions[index + 1].question = followUp.question.trim().slice(0, 1500);
            interview.questions[index + 1].difficulty = difficulty;
            interview.questions[index + 1].timer = timer;
        }

        interview.currentQuestion++;


        if (completed) {

            interview.status = "completed";

            interview.overallScore =
                result.report.overallScore;

            interview.summary =
                result.report.summary;

            interview.strengths =
                result.report.strengths;

            interview.weaknesses =
                result.report.weaknesses;

            interview.recommendations =
                result.report.recommendations;

            interview.submissionInProgress = false;
            await interview.save()

            await redis.del(`interviews:${userId}`)

            return res.status(200).json({

                success: true,

                completed: true,

                interview,

                feedback: result.feedback,

            });

        }


        interview.submissionInProgress = false;
        await interview.save()

        await redis.del(`interviews:${userId}`)

        return res.status(200).json({

            success: true,

            completed: false,

            currentQuestion: interview.currentQuestion,

            question:
                interview.questions[
                interview.currentQuestion
                ],

            feedback: result.feedback,

        });

    } catch (error) {
        if (claimedInterviewId && claimedUserId) {
            await Interview.updateOne(
                { _id: claimedInterviewId, userId: claimedUserId },
                { $set: { submissionInProgress: false } }
            ).catch(() => {});
        }

        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });

    }
}


export const getInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]
        const { id } = req.params

        const interview = await Interview.findOne({
            _id: id,
            userId
        }).lean()
        if (!interview) {
            return res.status(404).json({
                success: false,
                message: "Interview not found",
            });
        }

        return res.status(200).json({
            success: true,
            interview,
        });
    } catch (error) {
        console.log(error);

        return res.status(500).json({

            success: false,

            message: error.message,

        });
    }
}


export const getAllInterviews = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"]

        const cache = await redis.get(`interviews:${userId}`)

        if (cache) {
            console.log("✅ Data served from Redis")
            return res.status(200).json(JSON.parse(cache))
        }

        const interviews = await Interview.find({ userId }).sort({ createdAt: -1 })

        const completed = interviews.filter((item) => item.status === "completed")

        const totalQuestions = interviews.reduce((sum, item) => sum + item.questions.length, 0)

        const averageScore = completed.length > 0 ? Number(
            (completed.reduce((sum, item) => sum + item.overallScore, 0)) / completed.length).toFixed(1) : 0


        const stats = {
            totalInterviews: interviews.length,
            totalQuestions,
            completed: completed.length,
            averageScore
        }


        const getAverageData = (list) => {
            if (!list.length) {
                return [
                    { skill: "Correctness", score: 0 },
                    { skill: "Clarity", score: 0 },
                    { skill: "Relevance", score: 0 },
                    { skill: "Detail", score: 0 },
                    { skill: "Efficiency", score: 0 },
                    { skill: "Communication", score: 0 },
                    { skill: "Problem solving", score: 0 },
                    { skill: "Creativity", score: 0 },
                ];
            }

            const total = {
                correctness: 0,
                clarity: 0,
                relevance: 0,
                detail: 0,
                efficiency: 0,
                communication: 0,
                problemSolving: 0,
                creativity: 0,
            }

            list.forEach((interview) => {
                interview.questions.forEach((q) => {
                    total.correctness += q.feedback.correctness || 0;
                    total.clarity += q.feedback.clarity || 0;
                    total.relevance += q.feedback.relevance || 0;
                    total.detail += q.feedback.detail || 0;
                    total.efficiency += q.feedback.efficiency || 0;
                    total.communication += q.feedback.communication || 0;
                    total.problemSolving += q.feedback.problemSolving || 0;
                    total.creativity += q.feedback.creativity || 0;

                })
            })

            const count = list.reduce((sum, item) => sum + item.questions.length, 0)

            if (count === 0) {
                return [
                    { skill: "Correctness", score: 0 },
                    { skill: "Clarity", score: 0 },
                    { skill: "Relevance", score: 0 },
                    { skill: "Detail", score: 0 },
                    { skill: "Efficiency", score: 0 },
                    { skill: "Communication", score: 0 },
                    { skill: "Problem solving", score: 0 },
                    { skill: "Creativity", score: 0 },
                ];
            }


            return [
                {
                    skill: "Correctness",
                    score: Math.round(total.correctness / count)
                },
                {
                    skill: "Clarity",
                    score: Math.round(total.clarity / count),
                },

                {
                    skill: "Relevance",
                    score: Math.round(total.relevance / count),
                },

                {
                    skill: "Detail",
                    score: Math.round(total.detail / count),
                },

                {
                    skill: "Efficiency",
                    score: Math.round(total.efficiency / count),
                },

                {
                    skill: "Communication",
                    score: Math.round(total.communication / count),
                },

                {
                    skill: "Problem solving",
                    score: Math.round(total.problemSolving / count),
                },

                {
                    skill: "Creativity",
                    score: Math.round(total.creativity / count),
                },


            ]
        }

            const technicalInterviews = completed.filter((item) => item.type === "technical")

            const HrInterviews = completed.filter((item) => item.type === "hr")


            const technicalData = getAverageData(technicalInterviews)

            const hrData = getAverageData(HrInterviews)

            const technicalCount = technicalInterviews.length

            const hrCount = HrInterviews.length

            const payload = {
                success: true,
                interviews,
                stats,
                technicalData,
                hrData,
                technicalCount,
                hrCount,
            }

            await redis.set(`interviews:${userId}`, JSON.stringify(payload), "EX", 600)


            return res.status(200).json(payload);

        


    } catch (error) {
        console.log(error)
        return res.status(500).json({

            success: false,

            message: error.message,

        });
    }
}

export const getPeerBenchmark = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const ownAttempts = await Interview.find({ userId, status: "completed" })
            .sort({ createdAt: -1 })
            .select("role type difficultyMode companyName overallScore")
            .lean();
        if (!ownAttempts.length) {
            return res.json({ success: true, benchmark: { available: false, message: "Complete an interview to compare your progress." } });
        }

        const latest = ownAttempts[0];
        const roleKey = latest.role.trim().toLowerCase();
        const matchingOwnAttempts = ownAttempts.filter((item) =>
            item.type === latest.type &&
            item.difficultyMode === latest.difficultyMode &&
            (item.companyName || "") === (latest.companyName || "") &&
            item.role.trim().toLowerCase() === roleKey
        );
        const ownAverage = matchingOwnAttempts.reduce((sum, item) => sum + (item.overallScore || 0), 0) / matchingOwnAttempts.length;

        const groups = await Interview.aggregate([
            { $match: { status: "completed", type: latest.type, difficultyMode: latest.difficultyMode, companyName: latest.companyName || "" } },
            { $addFields: { normalizedRole: { $toLower: { $trim: { input: "$role" } } } } },
            { $match: { normalizedRole: roleKey } },
            { $group: { _id: "$userId", score: { $avg: "$overallScore" } } },
            { $group: {
                _id: null,
                participants: { $sum: 1 },
                averageScore: { $avg: "$score" },
                scoresBelowMe: { $sum: { $cond: [{ $lt: ["$score", ownAverage] }, 1, 0] } },
            } },
        ]);
        const cohort = groups[0];
        if (!cohort || cohort.participants < 10) {
            return res.json({ success: true, benchmark: { available: false, message: "Anonymous comparison appears after at least 10 people complete this interview type for the same role and level." } });
        }
        return res.json({
            success: true,
            benchmark: {
                available: true,
                role: latest.role,
                type: latest.type,
                difficultyMode: latest.difficultyMode,
                personalAverage: Math.round(ownAverage),
                peerAverage: Math.round(cohort.averageScore),
                percentile: Math.round((cohort.scoresBelowMe / cohort.participants) * 100),
                cohortSize: cohort.participants,
            },
        });
    } catch (error) {
        console.error("Could not calculate peer benchmark:", error.message);
        return res.status(500).json({ success: false, message: "Could not load the anonymous peer benchmark." });
    }
};

export const deleteInterview = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];
        const { id } = req.params;
        if (!userId) {
            return res.status(401).json({ success: false, message: "Sign in to delete an interview." });
        }
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ success: false, message: "Invalid interview id." });
        }

        const deleted = await Interview.findOneAndDelete({ _id: id, userId });
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Interview not found." });
        }

        await redis.del(`interviews:${userId}`);
        return res.status(200).json({ success: true, message: "Interview deleted." });
    } catch (error) {
        console.error("Could not delete interview:", error.message);
        return res.status(500).json({ success: false, message: "Could not delete this interview." });
    }
};
