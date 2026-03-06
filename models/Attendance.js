import mongoose from "mongoose";

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student"
  },

  faculty: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  subject: String,

  date: {
    type: String,
    required: true
  },

  status: {
    type: String,
    enum: ["pending", "present", "absent"],
    default: "pending"
  },

  // student selfie
  selfie: String,

  // face recognition descriptor
  faceDescriptor: [Number],

  // face match score
  matchScore: Number,

  latitude: Number,
  longitude: Number,

  checkinTime: Date,

  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  verifiedAt: Date,

  type: {
    type: String,
    enum: ["student", "faculty"],
    default: "student"
  },

  deviceInfo: String

}, { timestamps: true });

export default mongoose.model("Attendance", attendanceSchema);