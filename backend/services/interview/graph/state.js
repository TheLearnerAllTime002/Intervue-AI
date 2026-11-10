import { Annotation } from "@langchain/langgraph";


const InterviewState = Annotation.Root({
    action: Annotation(),

    type: Annotation(),

    role: Annotation(),

    difficultyMode: Annotation(),

    companyName: Annotation(),

    useResume: Annotation(),

    resume: Annotation(),

    questions: Annotation(),

    askedQuestions: Annotation(),

    question: Annotation(),

    answer: Annotation(),

    difficulty: Annotation(),

    feedback: Annotation(),

    nextQuestion: Annotation(),

    report: Annotation(),

    completed: Annotation(),
})


export default InterviewState
