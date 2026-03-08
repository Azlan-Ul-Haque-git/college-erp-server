import mongoose from "mongoose";
const assignmentSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  subject: { type: String, required: true },
  branch: { type: String, default: "ALL" },
  semester: Number,
  dueDate: Date,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  fileUrl: String,
}, { timestamps: true });
export default mongoose.model("Assignment", assignmentSchema);