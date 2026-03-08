import mongoose from "mongoose";
const grievanceSchema = new mongoose.Schema({
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  category: { type: String, enum: ["Academic", "Infrastructure", "Fee", "Harassment", "Other"], default: "Other" },
  subject: { type: String, required: true },
  description: { type: String, required: true },
  status: { type: String, enum: ["Pending", "In Progress", "Resolved"], default: "Pending" },
  adminReply: String,
}, { timestamps: true });
export default mongoose.model("Grievance", grievanceSchema);