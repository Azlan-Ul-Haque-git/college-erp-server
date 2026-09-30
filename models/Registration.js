import mongoose from "mongoose";
const registrationSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "faculty"], required: true },
  phone: String,
  // Student fields
  rollNumber: String,
  branch: String,
  semester: Number,
  year: Number,
  section: String,

  admissionNo: String,
  parentName: String,
  parentPhone: String,
  backlogCount: { type: Number, default: 0 },

  // Faculty fields
  department: String,
  designation: String,
  employeeId: String,
  qualification: String,
  experience: { type: Number, default: 0 },
  subjects: [String],
  // Status

  studentStatus: {
    type: String,
    enum: ["regular", "backlog", "ba", "passout"],
    default: "regular",
  },
  // 
  status: {
    type: String,
    enum: ["Pending", "Approved", "Rejected"],
    default: "Pending",
  },

  adminRemarks: String,
}, { timestamps: true });
export default mongoose.model("Registration", registrationSchema);