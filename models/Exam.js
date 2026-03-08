import mongoose from "mongoose";
const examSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  examType: { type: String, enum: ["Mid-term", "End-term", "Quiz", "Practical", "Assignment"], default: "Mid-term" },
  branch: { type: String, default: "ALL" },
  semester: Number,
  examDate: { type: Date, required: true },
  startTime: String,
  endTime: String,
  room: String,
  totalMarks: { type: Number, default: 100 },
  instructions: String,
}, { timestamps: true });
export default mongoose.model("Exam", examSchema);