import mongoose from "mongoose";
const studentSchema = new mongoose.Schema({

  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  rollNo: { type: String, required: true, unique: true },
  branch: { type: String, required: true },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  section: { type: String, required: true },
  status: {
    type: String,
    enum: ["regular", "backlog", "ba_scheme", "passout"],
    default: "regular",
  },

  backlogCount: {
    type: Number,
    default: 0,
  },
  
  admissionNo: { type: String },
  dob: { type: Date },
  gender: { type: String },
  address: { type: String },
  parentName: { type: String },
  parentPhone: { type: String },
  faceData: { type: String, default: "" },
}, { timestamps: true });
export default mongoose.model("Student", studentSchema);