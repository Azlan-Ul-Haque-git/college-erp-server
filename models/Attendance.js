import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
  faculty: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  subject: { type: String },
  date: { type: String, required: true },
  status: { type: String, enum: ["pending", "present", "absent"], default: "pending" },
  selfie: { type: String }, // base64 image
  latitude: { type: Number },
  longitude: { type: Number },
  checkinTime: { type: Date },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  verifiedAt: { type: Date },
  type: { type: String, enum: ["student", "faculty"], default: "student" },
}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);