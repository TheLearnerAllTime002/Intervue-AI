import mongoose from "mongoose";


const feedbackSchema = new mongoose.Schema(
    {
        score: {
            type: Number,
            default: 0,
        },

        correctness: {
            type: Number,
            default: 0,
        },

        clarity: {
            type: Number,
            default: 0,
        },

        relevance: {
            type: Number,
            default: 0,
        },

        detail: {
            type: Number,
            default: 0,
        },

        efficiency: {
            type: Number,
            default: 0,
        },

        communication: {
            type: Number,
            default: 0,
        },

        problemSolving: {
            type: Number,
            default: 0,
        },

        creativity: {
            type: Number,
            default: 0,
        },

        confidence: {
            type: Number,
            default: 0,
        },

        fillerWordCount: {
            type: Number,
            default: 0,
        },

        fillerWords: {
            type: [String],
            default: [],
        },

        feedback: {
            type: String,
            default: "",
        },

        improvements: {
            type: [String],
            default: [],
        },
    },
    { _id: false }
);

const questionSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: true,
        },
        userAnswer: {
            type: String,
            default: "",
        },
        answeredAt: {
            type: Date,
            default: null,
        },

        difficulty: {
            type: String,
            enum: ["easy", "medium", "hard"],
            default: "easy",
        },

        timer: {
            type: Number,
            default: 60,
        },

        feedback: {
            type: feedbackSchema,
            default: () => ({}),
        },
    },
    { _id: false }
);

const interviewSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },

        type: {
            type: String,
            enum: ["hr", "technical"],
            required: true,
        },

        role: {
            type: String,
            required: true,
        },
        difficultyMode: {
            type: String,
            enum: ["beginner", "intermediate", "advanced", "company-specific"],
            default: "intermediate",
        },
        companyName: {
            type: String,
            default: "",
            maxlength: 120,
        },
        useResume: {
            type: Boolean,
            default: false,
        },

        currentQuestion: {
            type: Number,
            default: 0,
        },

        questions: {
            type: [questionSchema],
            default: [],
        },

        overallScore: {
            type: Number,
            default: 0,
        },

        strengths: {
            type: [String],
            default: [],
        },

        weaknesses: {
            type: [String],
            default: [],
        },

        recommendations: {
            type: [String],
            default: [],
        },

        summary: {
            type: String,
            default: "",
        },

        status: {
            type: String,
            enum: ["in-progress", "completed"],
            default: "in-progress",
        },
        submissionInProgress: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Interview = mongoose.model("Interview" , interviewSchema)

export default Interview
