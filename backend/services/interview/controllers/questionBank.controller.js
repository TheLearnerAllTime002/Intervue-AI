import mongoose from "mongoose";
import QuestionBank from "../models/questionBank.model.js";

export const getQuestionBanks = async (req, res) => {
  const userId = req.headers["x-user-id"];
  const banks = await QuestionBank.find({ userId }).sort({ updatedAt: -1 }).lean();
  return res.json({ success: true, banks });
};

export const createQuestionBank = async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { name, role = "", type = "mixed" } = req.body ?? {};
  if (typeof name !== "string" || name.trim().length < 2 || name.length > 80) {
    return res.status(400).json({ success: false, message: "Bank name must be 2 to 80 characters." });
  }
  if (typeof role !== "string" || role.length > 120 || !["hr", "technical", "mixed"].includes(type)) {
    return res.status(400).json({ success: false, message: "Enter a valid role and question type." });
  }
  try {
    if (await QuestionBank.countDocuments({ userId }) >= 25) {
      return res.status(409).json({ success: false, message: "You can create up to 25 personal question banks." });
    }
    const bank = await QuestionBank.create({ userId, name: name.trim(), role: role.trim(), type });
    return res.status(201).json({ success: true, bank });
  } catch (error) {
    if (error.code === 11000) return res.status(409).json({ success: false, message: "You already have a bank with that name." });
    throw error;
  }
};

export const addBankQuestion = async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;
  const { question, sourceInterviewId } = req.body ?? {};
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid question bank." });
  if (typeof question !== "string" || question.trim().length < 5 || question.length > 2000) {
    return res.status(400).json({ success: false, message: "Question must be 5 to 2,000 characters." });
  }
  const bank = await QuestionBank.findOne({ _id: id, userId });
  if (!bank) return res.status(404).json({ success: false, message: "Question bank not found." });
  if (bank.questions.length >= 200) return res.status(409).json({ success: false, message: "This bank has reached its 200 question limit." });
  const normalized = question.trim().toLowerCase();
  if (bank.questions.some((item) => item.question.trim().toLowerCase() === normalized)) {
    return res.status(409).json({ success: false, message: "That question is already in this bank." });
  }
  bank.questions.push({
    question: question.trim(),
    sourceInterviewId: mongoose.isValidObjectId(sourceInterviewId) ? sourceInterviewId : null,
  });
  await bank.save();
  return res.status(201).json({ success: true, bank });
};

export const deleteBankQuestion = async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id, questionId } = req.params;
  if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(questionId)) {
    return res.status(400).json({ success: false, message: "Invalid question bank or question." });
  }
  const bank = await QuestionBank.findOne({ _id: id, userId });
  if (!bank) return res.status(404).json({ success: false, message: "Question bank not found." });
  const question = bank.questions.id(questionId);
  if (!question) return res.status(404).json({ success: false, message: "Question not found." });
  question.deleteOne();
  await bank.save();
  return res.json({ success: true, bank });
};

export const deleteQuestionBank = async (req, res) => {
  const userId = req.headers["x-user-id"];
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid question bank." });
  const deleted = await QuestionBank.findOneAndDelete({ _id: id, userId });
  if (!deleted) return res.status(404).json({ success: false, message: "Question bank not found." });
  return res.json({ success: true });
};
