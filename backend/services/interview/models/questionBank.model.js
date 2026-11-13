import mongoose from "mongoose";

const bankQuestionSchema = new mongoose.Schema({
  question: { type: String, required: true, trim: true, maxlength: 2000 },
  answer: { type: String, default: "", trim: true, maxlength: 10000 },
  sourceInterviewId: { type: mongoose.Schema.Types.ObjectId, default: null },
}, { timestamps: true });

const questionBankSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  name: { type: String, required: true, trim: true, maxlength: 80 },
  role: { type: String, default: "", trim: true, maxlength: 120 },
  type: { type: String, enum: ["hr", "technical", "mixed"], default: "mixed" },
  questions: { type: [bankQuestionSchema], default: [] },
}, { timestamps: true });

questionBankSchema.index({ userId: 1, name: 1 }, { unique: true });

export default mongoose.model("QuestionBank", questionBankSchema);
