import mongoose from "mongoose";

const noticeSchema = new mongoose.Schema(
  {
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

    /* ── TARGET: WHO CAN SEE ── */
    targetRole: {
      type: String,
      enum: ["all", "student", "faculty"],
      default: "all",
    },

    /* ── STUDENT SUB-FILTER ── */
    targetStudentStatus: {
      type: String,
      enum: ["all", "regular", "backlog", "ba", "passout"],
      default: "all",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notice", noticeSchema);