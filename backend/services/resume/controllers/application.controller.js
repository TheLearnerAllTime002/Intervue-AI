import mongoose from "mongoose";
import Application from "../models/application.model.js";

const STAGES = ["saved", "applied", "interviewing", "offer", "rejected"];
const userIdFrom = (req) => req.headers["x-user-id"];

export const listApplications = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to view your applications." });
    const applications = await Application.find({ userId }).sort({ updatedAt: -1 }).lean();
    return res.status(200).json({ success: true, data: applications });
  } catch (error) {
    console.error("Could not load applications:", error.message);
    return res.status(500).json({ success: false, message: "Could not load applications." });
  }
};

export const createApplication = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to save an application." });
    const { company, role, stage = "saved", deadline = null, jobUrl = "", notes = "" } = req.body ?? {};
    if (typeof company !== "string" || !company.trim() || company.length > 160 || typeof role !== "string" || !role.trim() || role.length > 160) {
      return res.status(400).json({ success: false, message: "Company and role are required and must be 160 characters or fewer." });
    }
    if (!STAGES.includes(stage)) return res.status(400).json({ success: false, message: "Choose a valid application stage." });
    if (typeof jobUrl !== "string" || typeof notes !== "string" || jobUrl.length > 1000 || notes.length > 2000) {
      return res.status(400).json({ success: false, message: "The job link or notes are too long." });
    }
    const parsedDeadline = deadline ? new Date(deadline) : null;
    if (deadline && Number.isNaN(parsedDeadline.getTime())) return res.status(400).json({ success: false, message: "Enter a valid deadline." });
    const application = await Application.create({ userId, company: company.trim(), role: role.trim(), stage, deadline: parsedDeadline, jobUrl: jobUrl.trim(), notes: notes.trim() });
    return res.status(201).json({ success: true, data: application });
  } catch (error) {
    console.error("Could not create application:", error.message);
    return res.status(500).json({ success: false, message: "Could not save this application." });
  }
};

export const updateApplication = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to update an application." });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid application id." });

    const allowed = ["company", "role", "stage", "deadline", "jobUrl", "notes"];
    const update = {};
    for (const key of allowed) if (Object.hasOwn(req.body ?? {}, key)) update[key] = req.body[key];
    if (!Object.keys(update).length) return res.status(400).json({ success: false, message: "Provide an application field to update." });
    if (update.stage && !STAGES.includes(update.stage)) return res.status(400).json({ success: false, message: "Choose a valid application stage." });
    if (update.company !== undefined && (typeof update.company !== "string" || !update.company.trim() || update.company.length > 160)) return res.status(400).json({ success: false, message: "Company must be between 1 and 160 characters." });
    if (update.role !== undefined && (typeof update.role !== "string" || !update.role.trim() || update.role.length > 160)) return res.status(400).json({ success: false, message: "Role must be between 1 and 160 characters." });
    if (update.jobUrl !== undefined && (typeof update.jobUrl !== "string" || update.jobUrl.length > 1000)) return res.status(400).json({ success: false, message: "Job link must be 1,000 characters or fewer." });
    if (update.notes !== undefined && (typeof update.notes !== "string" || update.notes.length > 2000)) return res.status(400).json({ success: false, message: "Notes must be 2,000 characters or fewer." });
    if (Object.hasOwn(update, "deadline")) {
      if (update.deadline === "" || update.deadline === null) update.deadline = null;
      else {
        update.deadline = new Date(update.deadline);
        if (Number.isNaN(update.deadline.getTime())) return res.status(400).json({ success: false, message: "Enter a valid deadline." });
      }
    }
    for (const key of ["company", "role", "jobUrl", "notes"]) if (typeof update[key] === "string") update[key] = update[key].trim();

    const application = await Application.findOneAndUpdate({ _id: id, userId }, update, { new: true, runValidators: true });
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    return res.status(200).json({ success: true, data: application });
  } catch (error) {
    console.error("Could not update application:", error.message);
    return res.status(500).json({ success: false, message: "Could not update this application." });
  }
};

export const deleteApplication = async (req, res) => {
  try {
    const userId = userIdFrom(req);
    const { id } = req.params;
    if (!userId) return res.status(401).json({ success: false, message: "Sign in to delete an application." });
    if (!mongoose.isValidObjectId(id)) return res.status(400).json({ success: false, message: "Invalid application id." });
    const application = await Application.findOneAndDelete({ _id: id, userId });
    if (!application) return res.status(404).json({ success: false, message: "Application not found." });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Could not delete application:", error.message);
    return res.status(500).json({ success: false, message: "Could not delete this application." });
  }
};
