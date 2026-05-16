import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  content: {
    type: String,
    required: true,
  },

  category: {
    type: String,
    enum: ["exam", "holiday", "event", "general", "urgent"],
    default: "general",
  },

  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },

  // OLD ROLE TARGET
  targetRole: {
    type: String,
    enum: ["all", "student", "faculty"],
    default: "all",
  },

  // NEW AUDIENCE TARGET
  targetAudience: {
    type: String,
    enum: ["all", "students", "faculty"],
    default: "all",
  },

  // NEW STUDENT STATUS TARGET
  targetStudentStatus: {
    type: String,
    enum: ["all", "regular", "backlog", "ba_scheme", "passout"],
    default: "all",
  },

  isActive: {
    type: Boolean,
    default: true,
  },

}, { timestamps: true });

export default mongoose.model("Notice", noticeSchema);