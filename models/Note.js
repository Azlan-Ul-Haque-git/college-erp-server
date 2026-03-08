import mongoose from "mongoose";
const noteSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subject: { type: String, required: true },
  branch: { type: String, default: "ALL" },
  semester: Number,
  description: String,
  fileUrl: String,
  fileType: String,
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
export default mongoose.model("Note", noteSchema);