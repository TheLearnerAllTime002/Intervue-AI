import { feedbackAgent } from "../agents/feedback.agent.js";
import { interviewAgent } from "../agents/interview.agent.js";
import { summaryAgent } from "../agents/summary.agent.js";



export async function interviewNode(state) {
    const questions = await interviewAgent({
        role:state.role,
        type:state.type,
        difficultyMode: state.difficultyMode,
        companyName: state.companyName,
        useResume:state.useResume,
        resume:state.resume

    })

    return {
        questions
    }
    
}

export async function feedbackNode(state) {
    const result = await feedbackAgent({
        role: state.role,
        type: state.type,
        question: state.question,
        answer: state.answer,
        difficulty: state.difficulty,
        askedQuestions: state.askedQuestions,
        generateFollowUp: !state.completed,
    })

    const fillerPattern = /\b(?:um+|uh+|erm+|er+|ah+|hmm+|like|basically|actually|literally|you know|i mean)\b/gi
    const fillerMatches = state.answer.match(fillerPattern) || []
    const feedback = {
        ...result.feedback,
        fillerWordCount: fillerMatches.length,
        fillerWords: [...new Set(fillerMatches.map((word) => word.toLowerCase()))],
    }

    return {
        feedback,
        nextQuestion: result.nextQuestion,
    }
}


export async function summaryNode(state) {
    const report = await summaryAgent({
         role: state.role,

        type: state.type,

        questions: state.questions,
    })

    return {
        report
    }
}
