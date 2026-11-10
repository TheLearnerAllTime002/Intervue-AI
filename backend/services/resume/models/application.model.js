import mongoose from "mongoose";

const applicationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  company: { type: String, required: true, trim: true, maxlength: 160 },
  role: { type: String, required: true, trim: true, maxlength: 160 },
  stage: {
    type: String,
    enum: ["saved", "applied", "interviewing", "offer", "rejected"],
    default: "saved",
  },
  deadline: { type: Date, default: null },
  jobUrl: { type: String, trim: true, maxlength: 1000, default: "" },
  notes: { type: String, trim: true, maxlength: 2000, default: "" },
}, { timestamps: true });

applicationSchema.index({ userId: 1, updatedAt: -1 });

export default mongoose.model("Application", applicationSchema);
